import { expect, test, type Page } from "@playwright/test";

function shareResponse(activeHumanNodes: number, humanNodeActive = true) {
  return {
    percent:
      humanNodeActive && activeHumanNodes > 0 ? 100 / activeHumanNodes : 0,
    activeHumanNodes,
    humanNodeActive,
    finalizedBlockHash: `0x${"ab".repeat(32)}`,
    checkedAt: new Date().toISOString(),
  };
}

async function installFixtures(page: Page) {
  const state = {
    address: "network-share-viewer" as string | null,
    activeHumanNodes: 1_000_000,
    humanNodeActive: true,
    unavailable: false,
    requests: 0,
  };
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/me") {
      await route.fulfill({
        json: state.address
          ? {
              authenticated: true,
              address: state.address,
              gate: { eligible: true, expiresAt: "2099-01-01T00:00:00Z" },
            }
          : { authenticated: false },
      });
    } else if (path === "/api/my-governance/network-share") {
      state.requests += 1;
      await route.fulfill({
        status: state.unavailable ? 503 : 200,
        json: state.unavailable
          ? { error: { message: "Network unavailable" } }
          : shareResponse(state.activeHumanNodes, state.humanNodeActive),
      });
    } else if (path === "/api/my-governance") {
      await route.fulfill({
        json: {
          eraActivity: { era: "4", required: 0, completed: 0, actions: [] },
          myChamberIds: [],
          delegation: { chambers: [] },
          legitimacy: {
            percent: 100,
            objecting: false,
            objectingHumanNodes: 0,
            eligibleHumanNodes: 5,
            referendumTriggered: false,
            triggerThresholdPercent: 33.3,
          },
        },
      });
    } else if (path === "/api/chambers") {
      await route.fulfill({ json: { items: [] } });
    } else {
      await route.fulfill({
        status: 503,
        json: { error: { message: "Unavailable in isolated ownership test" } },
      });
    }
  });
  return state;
}

function networkSection(page: Page) {
  return page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Share of the network",
      exact: true,
    }),
  });
}

for (const theme of ["light", "sky", "night", "fire"]) {
  for (const width of [390, 1440]) {
    test(`network ownership stays legible in ${theme} at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        (theme) => localStorage.setItem("vortex.theme", theme),
        theme,
      );
      await installFixtures(page);
      await page.goto("/app/my-governance");
      const section = networkSection(page);
      await expect(section).toContainText("0.0001%");
      await expect(section).toContainText("1,000,000");
      await expect(section).not.toContainText("20%");
      await section.scrollIntoViewIfNeeded();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      for (const tile of await section.locator(".glassy-metric-tile").all()) {
        expect(
          await tile.evaluate(
            (element) => element.scrollWidth <= element.clientWidth,
          ),
        ).toBe(true);
      }
      await page.screenshot({
        path: testInfo.outputPath(`network-share-${theme}-${width}.png`),
      });
    });
  }
}

test("polling updates ownership from the network roster, not the governor population", async ({
  page,
}) => {
  await page.clock.install();
  const state = await installFixtures(page);
  state.activeHumanNodes = 100;
  await page.goto("/app/my-governance");
  await expect(networkSection(page)).toContainText("1%");
  state.activeHumanNodes = 200;
  await page.clock.fastForward(60_000);
  await expect(networkSection(page)).toContainText("0.5%");
  expect(state.requests).toBe(2);
});

test("network errors clear stale ownership and recover on focus", async ({
  page,
}) => {
  const state = await installFixtures(page);
  await page.goto("/app/my-governance");
  await expect(networkSection(page)).toContainText("0.0001%");
  state.unavailable = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(networkSection(page)).toContainText(
    "Live Humanode network data is unavailable.",
  );
  await expect(networkSection(page)).not.toContainText("0.0001%");
  await expect(networkSection(page)).not.toContainText("0%");
  state.unavailable = false;
  state.activeHumanNodes = 100;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(networkSection(page)).toContainText("1%");
});

test("inactive Human Nodes show a real zero, not the equal active-node share", async ({
  page,
}) => {
  const state = await installFixtures(page);
  state.humanNodeActive = false;
  await page.goto("/app/my-governance");
  await expect(networkSection(page)).toContainText("0%");
  await expect(networkSection(page)).toContainText(
    "Your Human Node is inactive.",
  );
});

test("malformed successful responses leave governance usable and ownership unavailable", async ({
  page,
}) => {
  await installFixtures(page);
  await page.route("**/api/my-governance/network-share", (route) =>
    route.fulfill({ json: { items: [] } }),
  );
  await page.goto("/app/my-governance");
  await expect(networkSection(page)).toContainText(
    "Live Humanode network data is unavailable.",
  );
  await expect(
    page.getByRole("heading", { name: "Tier progress", exact: true }),
  ).toBeVisible();
});

test("anonymous viewers get a connection prompt without requesting a personal share", async ({
  page,
}) => {
  const state = await installFixtures(page);
  state.address = null;
  await page.goto("/app/my-governance");
  await expect(networkSection(page)).toContainText(
    "Connect your wallet to view your network share.",
  );
  expect(state.requests).toBe(0);
});

test("a slow ownership request is coalesced across focus events and polling", async ({
  page,
}) => {
  await page.clock.install();
  await installFixtures(page);
  let requests = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/my-governance/network-share", async (route) => {
    requests += 1;
    await pending;
    await route.fulfill({
      json: shareResponse(100),
    });
  });
  await page.goto("/app/my-governance");
  await expect.poll(() => requests).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.clock.fastForward(120_000);
  expect(requests).toBe(1);
  release();
  await expect(networkSection(page)).toContainText("1%");
});

test("an old-wallet response cannot replace the new account's network share", async ({
  page,
}) => {
  await page.clock.install();
  const state = await installFixtures(page);
  let requests = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/my-governance/network-share", async (route) => {
    requests += 1;
    const oldWallet = requests === 1;
    if (oldWallet) await pending;
    await route.fulfill({
      json: shareResponse(100, oldWallet),
    });
  });
  await page.goto("/app/my-governance");
  await expect.poll(() => requests).toBe(1);
  state.address = "inactive-network-share-viewer";
  await page.clock.fastForward(60_000);
  await expect(networkSection(page)).toContainText(
    "Your Human Node is inactive.",
  );
  release();
  await expect(networkSection(page)).toContainText("0%");
  await expect(networkSection(page)).not.toContainText("1%");
});
