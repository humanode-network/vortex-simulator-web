import { expect, test, type Page } from "@playwright/test";

const accountAddress = "preview-wallet";
const activeIdentity = {
  id: accountAddress,
  name: "Navigation test account",
  governor: true,
  governorActive: false,
  humanNodeActive: true,
  heroStats: [],
  quickDetails: [],
  proofSections: {},
  governanceActions: [],
  delegation: { chambers: [] },
  projects: [],
};

async function mockAccount(page: Page, options?: { unavailable?: boolean }) {
  const state = {
    authenticated: true,
    unavailable: options?.unavailable ?? false,
    verificationUnavailable: false,
  };
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/logout") {
      state.authenticated = false;
      await route.fulfill({ json: { ok: true } });
    } else if (path === "/api/me") {
      await route.fulfill({
        json: state.authenticated
          ? {
              authenticated: true,
              address: accountAddress,
              gate: state.verificationUnavailable
                ? { eligible: false, reason: "rpc_error" }
                : { eligible: true, expiresAt: "2099-01-01T00:00:00.000Z" },
            }
          : { authenticated: false },
      });
    } else if (path === `/api/humans/${accountAddress}`) {
      await route.fulfill({
        status: state.unavailable ? 503 : 200,
        json: state.unavailable ? { message: "Unavailable" } : activeIdentity,
      });
    } else {
      await route.fallback();
    }
  });
  return state;
}

function accountTrigger(page: Page) {
  return page.getByRole("button", {
    name: `Account details for ${accountAddress}`,
  });
}

function identityValues(page: Page) {
  return page.locator(".sidebar__authValue").allTextContents();
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({
      status: path === "/api/me" ? 200 : 503,
      json:
        path === "/api/me"
          ? { authenticated: false }
          : { message: "Unavailable in isolated navigation test" },
    });
  });
});

test("identity polling keeps verified values and does not overlap requests", async ({
  page,
}) => {
  await mockAccount(page);
  let requests = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let releaseViewer!: () => void;
  const viewerPending = new Promise<void>((resolve) => {
    releaseViewer = resolve;
  });
  // Keep the separate urgent-feed reader pending while testing identity polling.
  await page.route("**/api/my-governance*", async (route) => {
    await viewerPending;
    await route.fulfill({
      json: { myChamberIds: ["general"], opportunityAccounting: null },
    });
  });
  await page.route(`**/api/humans/${accountAddress}`, async (route) => {
    requests++;
    if (requests === 3) await pending;
    await route.fulfill({
      json: { ...activeIdentity, governorActive: requests > 2 },
    });
  });
  await page.clock.install();
  await page.goto("/app/vortexopedia");
  await page.locator(".sidebar__brandLink").hover();
  await expect
    .poll(() => identityValues(page))
    .toEqual(["Active", "Active", "Not active"]);
  await expect.poll(() => requests).toBe(2);
  await page.clock.fastForward(60_000);
  await expect.poll(() => requests).toBe(3);
  await page.clock.fastForward(120_000);
  expect(requests).toBe(3);
  await expect
    .poll(() => identityValues(page))
    .toEqual(["Active", "Active", "Not active"]);
  release();
  await expect
    .poll(() => identityValues(page))
    .toEqual(["Active", "Active", "Active"]);
  await page.clock.fastForward(60_000);
  await expect.poll(() => requests).toBe(4);
  releaseViewer();
});

test("an identity response arriving after logout cannot restore old account statuses", async ({
  page,
}) => {
  await mockAccount(page);
  let release!: () => void;
  let fulfilled!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const completed = new Promise<void>((resolve) => {
    fulfilled = resolve;
  });
  await page.route(`**/api/humans/${accountAddress}`, async (route) => {
    await pending;
    await route.fulfill({ json: activeIdentity });
    fulfilled();
  });
  await page.goto("/app/vortexopedia");
  await accountTrigger(page).click();
  await expect
    .poll(() => identityValues(page))
    .toEqual(["Checking", "Checking", "Checking"]);
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Connect wallet", exact: true }),
  ).toBeEnabled();
  release();
  await completed;
  await expect(page.locator(".sidebar__identityRow")).toHaveCount(0);
  await expect(accountTrigger(page)).toHaveCount(0);
});

test("urgent refresh coalesces focus events and timer ticks while a request is pending", async ({
  page,
}) => {
  await mockAccount(page);
  let requests = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/my-governance*", async (route) => {
    requests++;
    if (requests === 2) await pending;
    await route.fulfill({
      json: { myChamberIds: ["general"], opportunityAccounting: null },
    });
  });
  await page.route("**/api/feed*", (route) =>
    route.fulfill({ json: { items: [] } }),
  );
  await page.clock.install();
  await page.goto("/app/vortexopedia");
  await expect.poll(() => requests).toBe(1);
  // Let the initial viewer and feed requests finish before requesting a refresh.
  await expect(page.locator(".sidebar__identityRow").last()).toHaveAttribute(
    "title",
    "Active governor: Not active",
  );
  await page.clock.fastForward(60_000);
  await expect.poll(() => requests).toBe(2);
  await page.evaluate(() => {
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("focus"));
  });
  await page.clock.fastForward(120_000);
  expect(requests).toBe(2);
  release();
});

test("every destination remains reachable from the redesigned rail", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/app/feed");
  const destinations = await page
    .locator(".sidebar__nav a")
    .evaluateAll((links) =>
      links.map((link) => ({
        label: link.getAttribute("aria-label")!,
        path: link.getAttribute("href")!,
      })),
    );
  expect(destinations).toHaveLength(15);
  for (const destination of destinations) {
    await page.goto("/app/feed");
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: destination.label, exact: true })
      .click();
    await expect(page).toHaveURL(destination.path);
    await expect(
      page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("link", { name: destination.label, exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
});

test("account details open only on activation and dismiss predictably", async ({
  page,
  context,
  browserName,
}) => {
  await mockAccount(page);
  if (browserName === "chromium")
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/app/vortexopedia");
  const account = accountTrigger(page);
  const dialog = page.getByRole("dialog", { name: "Wallet", exact: true });
  await page.locator(".sidebar__brandLink").hover();
  await expect(dialog).toHaveCount(0);
  await expect
    .poll(() => identityValues(page))
    .toEqual(["Active", "Active", "Not active"]);
  await expect(page.getByRole("definition").last()).toBeVisible();
  const positionsBefore = await page
    .locator(".sidebar__nav .sidebar__medallion")
    .evaluateAll((icons) =>
      icons.map((icon) => icon.getBoundingClientRect().toJSON()),
    );
  await page.mouse.move(800, 500);
  await expect(page.locator(".sidebar__identityText").first()).toBeHidden();
  await account.hover();
  expect(
    await page
      .locator(".sidebar__nav .sidebar__medallion")
      .evaluateAll((icons) =>
        icons.map((icon) => icon.getBoundingClientRect().toJSON()),
      ),
  ).toEqual(positionsBefore);
  await account.hover();
  await account.focus();
  await expect(dialog).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect(dialog).toBeFocused();
  await expect
    .poll(() => identityValues(page))
    .toEqual(["Active", "Active", "Not active"]);
  await dialog.getByRole("button", { name: "Copy address" }).click();
  await expect(
    dialog.getByRole("button", { name: "Copied", exact: true }),
  ).toBeVisible();
  if (browserName === "chromium")
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(accountAddress);
  await page.mouse.move(800, 500);
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(account).toBeFocused();
  await account.click();
  await page
    .locator("input[type='search'], input[placeholder^='Search']")
    .first()
    .click();
  await expect(dialog).toHaveCount(0);
  await account.click();
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Feed", exact: true })
    .focus();
  await expect(dialog).toHaveCount(0);
  await account.click();
  await dialog.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Connect wallet", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Connect wallet", exact: true }),
  ).toBeFocused();
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  const error = page.getByRole("dialog", { name: "Connection problem" });
  await expect(error).toContainText("extension");
  await expect(error.locator(".sidebar__authRow")).toHaveCount(0);
  await error.getByRole("button", { name: "Try again" }).click();
  await expect(error).toBeVisible();
  await page.keyboard.press("Escape");
  await page.mouse.move(800, 500);
  await page.keyboard.press("Escape");
  await expect(page.locator(".sidebar")).not.toHaveClass(/sidebar--expanded/);
});

test("Feed badge counts eligible distinct urgent items and hides on failure or logout", async ({
  page,
}) => {
  await mockAccount(page);
  let hasMore = false;
  let unavailable = false;
  const event = {
    id: "team-review",
    title: "Review a team application",
    meta: "Formation",
    stage: "build",
    summaryPill: "Formation",
    summary: "Review the application.",
    actionable: true,
    proposerId: accountAddress,
    href: "/app/proposals/preview-project/formation",
    timestamp: "2026-10-02T10:00:00Z",
  };
  await page.route("**/api/my-governance*", (route) =>
    route.fulfill({
      json: { myChamberIds: ["general"], opportunityAccounting: null },
    }),
  );
  await page.route("**/api/feed*", (route) =>
    route.fulfill({
      status: unavailable ? 503 : 200,
      json: unavailable
        ? { message: "Unavailable" }
        : {
            items: [
              event,
              { ...event, id: "duplicate-team-review" },
              {
                ...event,
                id: "another-team-review",
                href: "/app/proposals/another-project/formation",
              },
              {
                ...event,
                id: "ineligible-vote",
                stage: "vote",
                href: "/app/proposals/old-vote/chamber",
              },
            ],
            ...(hasMore ? { nextCursor: "more" } : {}),
          },
    }),
  );
  await page.goto("/app/vortexopedia");
  const badge = page.locator(".sidebar__countBadge");
  await expect(badge).toHaveText("2");
  await expect(page.locator("#sidebar-urgent-count")).toHaveText(
    "2 urgent feed items available",
  );
  hasMore = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(badge).toHaveText("2+");
  unavailable = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(badge).toHaveCount(0);
  unavailable = false;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(badge).toHaveText("2+");
  await accountTrigger(page).click();
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(badge).toHaveCount(0);
});

test("unavailable and unverified identity values never masquerade as inactive", async ({
  page,
}) => {
  const state = await mockAccount(page, { unavailable: true });
  await page.goto("/app/vortexopedia");
  await accountTrigger(page).click();
  await expect
    .poll(() => identityValues(page))
    .toEqual(["Unavailable", "Unavailable", "Unavailable"]);
  state.unavailable = false;
  await page.getByRole("button", { name: "Check again" }).click();
  await expect
    .poll(() => identityValues(page))
    .toEqual(["Active", "Active", "Not active"]);

  state.verificationUnavailable = true;
  await page.reload();
  await accountTrigger(page).click();
  await expect
    .poll(() => identityValues(page))
    .toEqual(["Unavailable", "Active", "Not active"]);
  state.verificationUnavailable = false;
  await page.getByRole("button", { name: "Check again" }).click();
  await expect
    .poll(() => identityValues(page))
    .toEqual(["Active", "Active", "Not active"]);
});

test("direct connection prevents duplicate requests and preserves a checking state", async ({
  page,
}) => {
  const state = await mockAccount(page);
  state.authenticated = false;
  await page.addInitScript((address) => {
    Object.assign(window, {
      injectedWeb3: {
        preview: {
          enable: async () => ({
            accounts: { get: async () => [{ address }] },
            signer: { signRaw: async () => ({ signature: "test-signature" }) },
          }),
        },
      },
    });
  }, accountAddress);
  let releaseNonce!: () => void;
  const nonceReady = new Promise<void>((resolve) => {
    releaseNonce = resolve;
  });
  let nonceRequests = 0;
  await page.route("**/api/auth/nonce*", async (route) => {
    nonceRequests++;
    await nonceReady;
    await route.fulfill({ json: { nonce: "test-nonce" } });
  });
  await page.route("**/api/auth/verify", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      address: accountAddress,
      nonce: "test-nonce",
      signature: "test-signature",
    });
    state.authenticated = true;
    await route.fulfill({ json: { ok: true } });
  });
  let releaseIdentity!: () => void;
  const identityReady = new Promise<void>((resolve) => {
    releaseIdentity = resolve;
  });
  await page.route(`**/api/humans/${accountAddress}`, async (route) => {
    await identityReady;
    await route.fulfill({ json: activeIdentity });
  });
  await page.goto("/app/vortexopedia");
  const connect = page.getByRole("button", {
    name: "Connect wallet",
    exact: true,
  });
  await expect(connect).toBeEnabled();
  const circleBefore = await connect
    .locator(".sidebar__medallion")
    .boundingBox();
  await connect.click();
  await expect(
    page.getByRole("button", { name: "Connecting...", exact: true }),
  ).toBeDisabled();
  await expect.poll(() => nonceRequests).toBe(1);
  releaseNonce();
  await expect(accountTrigger(page)).toBeEnabled();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await accountTrigger(page).click();
  await expect
    .poll(() => identityValues(page))
    .toEqual(["Checking", "Checking", "Checking"]);
  releaseIdentity();
  await expect
    .poll(() => identityValues(page))
    .toEqual(["Active", "Active", "Not active"]);
  expect(
    await accountTrigger(page).locator(".sidebar__medallion").boundingBox(),
  ).toEqual(circleBefore);
  expect(nonceRequests).toBe(1);
});

test("mobile account details fit the viewport and profile navigation closes the menu", async ({
  page,
}) => {
  await mockAccount(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/vortexopedia");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await accountTrigger(page).click();
  const dialog = page.getByRole("dialog", { name: "Wallet", exact: true });
  await expect
    .poll(() => identityValues(page))
    .toEqual(["Active", "Active", "Not active"]);
  const box = (await dialog.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(16);
  expect(box.x + box.width).toBeLessThanOrEqual(374);
  expect(box.y + box.height).toBeLessThanOrEqual(828);
  await page.screenshot({ path: "/tmp/navbar-account-mobile-verified.png" });
  await dialog.getByRole("link", { name: "View profile" }).click();
  await expect(page).toHaveURL("/app/profile");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
  await expect(dialog).toHaveCount(0);
});

test.describe("touch navigation", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });

  test("taps reach the final destination and wallet controls", async ({
    page,
  }) => {
    await mockAccount(page);
    await page.goto("/app/vortexopedia");
    await page.getByRole("button", { name: "Open navigation menu" }).tap();
    await accountTrigger(page).tap();
    const wallet = page.getByRole("dialog", { name: "Wallet", exact: true });
    for (const control of await wallet.locator('[data-ui="button"]').all()) {
      const box = (await control.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await wallet.getByRole("button", { name: "Close account details" }).tap();
    await expect(wallet).toHaveCount(0);
    const settings = page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Settings", exact: true });
    await settings.scrollIntoViewIfNeeded();
    await settings.tap();
    await expect(page).toHaveURL("/app/settings");
    await expect(
      page.getByRole("navigation", { name: "Primary" }),
    ).toBeHidden();
    await page.getByRole("button", { name: "Open navigation menu" }).tap();
    await accountTrigger(page).tap();
    await page.getByRole("button", { name: "Disconnect", exact: true }).tap();
    await expect(
      page.getByRole("button", { name: "Connect wallet", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close navigation menu" }).tap();
    await expect(
      page.getByRole("navigation", { name: "Primary" }),
    ).toBeHidden();
  });
});

test.describe("touch search filters", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test("the first outside tap activates its control while dismissing filters", async ({
    page,
  }) => {
    await page.goto("/app/vortexopedia");
    const search = page.getByRole("searchbox", { name: "Search terms" });
    await search.fill("governor");
    await expect(
      page.getByRole("button", { name: "Apply", exact: true }),
    ).toBeVisible();
    const expand = page.locator('[data-term-id="governor"] button');
    await expand.tap();
    await expect(expand).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("button", { name: "Apply", exact: true }),
    ).toHaveCount(0);
    await search.tap();
    await page.getByRole("button", { name: "Close", exact: true }).tap();
    await expect(search).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Apply", exact: true }),
    ).toHaveCount(0);
  });
});

test("a failed logout retains the account and permits a successful retry", async ({
  page,
}) => {
  await mockAccount(page);
  let attempts = 0;
  await page.route("**/api/auth/logout", async (route) => {
    attempts++;
    if (attempts === 1) {
      await route.fulfill({
        status: 503,
        json: { error: { message: "Logout temporarily unavailable" } },
      });
    } else await route.fallback();
  });
  await page.goto("/app/vortexopedia");
  await accountTrigger(page).click();
  const wallet = page.getByRole("dialog", { name: "Wallet", exact: true });
  const disconnect = wallet.getByRole("button", {
    name: "Disconnect",
    exact: true,
  });
  await disconnect.click();
  await expect(wallet).toContainText("Logout temporarily unavailable");
  await expect(accountTrigger(page)).toBeEnabled();
  await expect(disconnect).toBeEnabled();
  await disconnect.click();
  await expect(
    page.getByRole("button", { name: "Connect wallet", exact: true }),
  ).toBeEnabled();
  await expect(accountTrigger(page)).toHaveCount(0);
  expect(attempts).toBe(2);
});

test("activity pagination stops on a repeated cursor and supports an explicit retry", async ({
  page,
}) => {
  await mockAccount(page);
  let attempts = 0;
  let advancing = false;
  const event = (id: string) => ({
    id,
    title: id,
    meta: "System",
    stage: "system",
    summary: "A recorded system event.",
    summaryPill: "System",
    timestamp: "2026-10-02T00:00:00Z",
    actionable: false,
  });
  await page.route("**/api/my-governance*", (route) =>
    route.fulfill({
      json: { myChamberIds: ["general"], opportunityAccounting: null },
    }),
  );
  await page.route("**/api/feed*", (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("cursor") === "stalled") {
      attempts++;
      if (attempts > 3)
        return route.fulfill({
          status: 503,
          json: {
            error: { message: "Repeated request limit reached in test" },
          },
        });
      return route.fulfill({
        json: advancing
          ? { items: [event("Next activity record")] }
          : { items: [], nextCursor: "stalled" },
      });
    }
    const all =
      !url.searchParams.has("stage") && !url.searchParams.has("excludeStages");
    return route.fulfill({
      json: all
        ? { items: [event("Initial activity record")], nextCursor: "stalled" }
        : { items: [] },
    });
  });
  await page.goto("/app/feed");
  await page.getByRole("button", { name: "All activity", exact: true }).click();
  const error = page.locator(".feed-page__status--error");
  await expect(error).toContainText("could not advance");
  await expect(
    page.getByText("Initial activity record", { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(250);
  expect(attempts).toBe(1);
  advancing = true;
  await page.getByRole("button", { name: "Load more", exact: true }).click();
  await expect(
    page.getByText("Next activity record", { exact: true }),
  ).toBeVisible();
  await expect(error).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Load more", exact: true }),
  ).toHaveCount(0);
  expect(attempts).toBe(2);
});

test("all themes keep labels readable at desktop, mobile, and enlarged text sizes", async ({
  page,
}) => {
  test.setTimeout(90_000);
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/app/vortexopedia");
    for (const theme of ["light", "sky", "night", "fire"]) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.fontSize = "200%";
      }, theme);
      const skipLink = (await page
        .getByRole("link", { name: "Skip to content" })
        .boundingBox())!;
      expect(skipLink.y + skipLink.height).toBeLessThanOrEqual(0);
      if (width <= 960) {
        if (
          !(await page.getByRole("navigation", { name: "Primary" }).isVisible())
        )
          await page
            .getByRole("button", { name: "Open navigation menu" })
            .click();
      } else {
        await page.locator(".sidebar__brandLink").hover();
      }
      const nav = page.getByRole("navigation", { name: "Primary" });
      await expect(
        nav.getByRole("link", { name: "Humanode Codex" }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
      ).toBe(false);
      const overflow = await nav
        .locator(".sidebar__label")
        .evaluateAll((labels) =>
          labels.some(
            (label) => label.getBoundingClientRect().right > window.innerWidth,
          ),
        );
      expect(overflow).toBe(false);
    }
  }
});

for (const [width, height] of [
  [320, 568],
  [360, 640],
  [390, 844],
  [430, 932],
  [600, 400],
  [768, 1024],
  [844, 390],
  [960, 600],
  [961, 400],
  [1024, 768],
  [1440, 900],
  [1920, 1080],
  [2560, 1440],
]) {
  test(`connected navigation and wallet fit ${width}x${height}`, async ({
    page,
  }) => {
    await mockAccount(page);
    await page.setViewportSize({ width, height });
    await page.goto("/app/vortexopedia");
    const mainBefore = (await page.locator("#main").boundingBox())!;
    const mobile = width <= 960;
    if (mobile)
      await page.getByRole("button", { name: "Open navigation menu" }).click();
    else await page.locator(".sidebar__brandLink").hover();
    await expect
      .poll(() => identityValues(page))
      .toEqual(["Active", "Active", "Not active"]);
    const nav = page.getByRole("navigation", { name: "Primary" });
    const settings = nav.getByRole("link", { name: "Settings", exact: true });
    for (const theme of ["light", "sky", "night", "fire"]) {
      await page.evaluate(
        (theme) => (document.documentElement.dataset.theme = theme),
        theme,
      );
      const sidebarColor = await page
        .locator(".sidebar")
        .evaluate((element) => getComputedStyle(element).color);
      await expect(accountTrigger(page)).toHaveCSS("color", sidebarColor);
      if (mobile)
        await expect(
          page.getByRole("button", { name: "Close navigation menu" }),
        ).toHaveCSS("color", sidebarColor);
      const navBox = (await nav.boundingBox())!;
      expect(navBox.y).toBeGreaterThanOrEqual(0);
      expect(navBox.y + navBox.height).toBeLessThanOrEqual(height);
      const mainAfter = (await page.locator("#main").boundingBox())!;
      expect(mainAfter.x).toBe(mainBefore.x);
      expect(mainAfter.y).toBe(mainBefore.y);
      expect(mainAfter.width).toBe(mainBefore.width);
      await settings.scrollIntoViewIfNeeded();
      await expect(settings).toBeInViewport();
      expect(await page.evaluate(() => scrollY)).toBe(0);
      const label = (await settings.locator(".sidebar__label").boundingBox())!;
      expect(label.x + label.width).toBeLessThanOrEqual(width);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    }
    await accountTrigger(page).click();
    const dialog = page.getByRole("dialog", { name: "Wallet", exact: true });
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y + box.height).toBeLessThanOrEqual(height - 16);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    if (mobile) {
      await page.keyboard.press("Escape");
      await expect(nav).toBeHidden();
      await expect(
        page.getByRole("button", { name: "Open navigation menu" }),
      ).toBeFocused();
      await page.getByRole("button", { name: "Open navigation menu" }).click();
    }
    await settings.scrollIntoViewIfNeeded();
    await settings.click();
    await expect(page).toHaveURL("/app/settings");
    if (mobile) await expect(nav).toBeHidden();
  });
}

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`hover expands the whole desktop rail without moving the page with ${reducedMotion}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/app/feed");

    const rail = page.locator(".sidebar");
    const nav = page.getByRole("navigation", { name: "Primary" });
    const proposals = nav.getByRole("link", { name: "Proposals" });
    const courts = nav.getByRole("link", { name: "Courts" });
    const workspaceX = (await page.locator("#main").boundingBox())!.x;
    expect(workspaceX).toBe(88);
    const brand = page.locator(".sidebar__brandIdentity");
    await expect(brand).toContainText("Vortex");
    const brandBefore = await brand.boundingBox();
    const icons = page.locator(
      ".sidebar__brandMark, .sidebar__accountIcon, .sidebar__nav .sidebar__medallion",
    );
    const iconPositions = await icons.evaluateAll((icons) =>
      icons.map((icon) => icon.getBoundingClientRect().toJSON()),
    );
    const statusTop = await page
      .locator(".sidebar__mobilePanel")
      .evaluate((panel) => panel.getBoundingClientRect().top);
    expect(statusTop).toBeLessThan((await nav.boundingBox())!.y);

    await expect(rail).not.toHaveClass(/sidebar--expanded/);
    await expect(page.locator(".sidebar__surface")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    expect(
      await rail.evaluate((rail) => getComputedStyle(rail, "::before").content),
    ).toBe("none");
    await expect(brand).toHaveCSS("opacity", "0");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    for (const icon of iconPositions) expect(icon.x).toBe(24);
    expect((await nav.boundingBox())!.x).toBeLessThanOrEqual(18);
    for (const group of await nav.getByRole("region").all()) {
      const gaps = await group
        .locator(".sidebar__medallion")
        .evaluateAll((icons) => {
          const bounds = icons.map((icon) => icon.getBoundingClientRect());
          return bounds
            .slice(1)
            .map((rect, index) => rect.top - bounds[index].bottom);
        });
      for (const gap of gaps) {
        expect(gap).toBe(12);
      }
    }
    await expect
      .poll(() =>
        page
          .locator(".sidebar__brandImage")
          .evaluate((image) => (image as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await page.locator(".sidebar__brandLink").hover();
    await expect(brand).toHaveCSS("opacity", "1");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    for (const text of [
      brand,
      nav.locator(".sidebar__sectionTitle").first(),
      proposals.locator(".sidebar__label"),
    ]) {
      await expect(text).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(text).toHaveCSS("box-shadow", "none");
    }
    await proposals.hover();
    await expect(rail).toHaveClass(/sidebar--expanded/);
    await expect
      .poll(async () =>
        courts
          .locator(".sidebar__label")
          .evaluate((label) => getComputedStyle(label).opacity),
      )
      .toBe("1");
    expect((await page.locator("#main").boundingBox())!.x).toBe(workspaceX);
    expect(await brand.boundingBox()).toEqual(brandBefore);
    expect(
      await icons.evaluateAll((icons) =>
        icons.map((icon) => icon.getBoundingClientRect().toJSON()),
      ),
    ).toEqual(iconPositions);
    const rows = await nav.locator(".sidebar__link").evaluateAll((links) =>
      links.map((link) => {
        const icon = link
          .querySelector(".sidebar__medallion")!
          .getBoundingClientRect();
        const label = link
          .querySelector(".sidebar__label")!
          .getBoundingClientRect();
        const row = link.getBoundingClientRect();
        return {
          iconX: icon.x,
          labelX: label.x,
          labelRight: label.right,
          centerOffset: label.y + label.height / 2 - icon.y - icon.height / 2,
          height: row.height,
        };
      }),
    );
    for (const row of rows) {
      expect(row.height).toBe(48);
      expect(row.iconX).toBe(rows[0].iconX);
      expect(row.labelX).toBe(rows[0].labelX);
      expect(row.labelRight).toBeLessThan(260);
      expect(Math.abs(row.centerOffset)).toBeLessThan(0.5);
    }
    const labelBefore = await courts.locator(".sidebar__label").boundingBox();
    const weightBefore = await courts
      .locator(".sidebar__label")
      .evaluate((label) => getComputedStyle(label).fontWeight);

    const otherLabelColor = await courts
      .locator(".sidebar__label")
      .evaluate((label) => getComputedStyle(label).color);
    const otherCircleColor = await courts
      .locator(".sidebar__medallion")
      .evaluate((circle) => getComputedStyle(circle).borderColor);
    await courts.hover();
    expect(await courts.locator(".sidebar__label").boundingBox()).toEqual(
      labelBefore,
    );
    await expect(courts.locator(".sidebar__label")).toHaveCSS(
      "font-weight",
      weightBefore,
    );
    await expect(rail).toHaveClass(/sidebar--expanded/);
    const hoveredLabelColor = await courts
      .locator(".sidebar__label")
      .evaluate((label) => getComputedStyle(label).color);
    expect(hoveredLabelColor).not.toBe(otherLabelColor);
    await expect
      .poll(async () =>
        courts
          .locator(".sidebar__medallion")
          .evaluate((circle) => getComputedStyle(circle).borderColor),
      )
      .not.toBe(otherCircleColor);
    expect((await page.locator("#main").boundingBox())!.x).toBe(workspaceX);

    await courts.click();
    await page.mouse.move(500, 500);
    await expect(rail).not.toHaveClass(/sidebar--expanded/);
  });
}

test("expanded glass transmits and blurs page colors across themes", async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/app/vortexopedia");
  await page.evaluate(() => {
    const sample = document.createElement("div");
    sample.style.cssText =
      "position:fixed;left:144px;top:420px;width:80px;height:240px;background:linear-gradient(#ff2020 50%,#2020ff 50%);pointer-events:none";
    document.querySelector("#main")!.append(sample);
  });
  const surface = page.locator(".sidebar__surface");
  for (const theme of ["light", "sky", "night", "fire"]) {
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    await page.locator(".sidebar__brandLink").hover();
    await expect(surface).toHaveCSS("width", "260px");
    expect(
      await surface.evaluate(
        (element) => getComputedStyle(element, "::before").backdropFilter,
      ),
    ).toBe("blur(28px) saturate(1.8)");
    const screenshot = await page.screenshot({
      clip: { x: 200, y: 450, width: 8, height: 180 },
    });
    const colors = await page.evaluate(async (png) => {
      const bitmap = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${png}`)).blob(),
      );
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(bitmap, 0, 0);
      const red = Array.from(context.getImageData(4, 10, 1, 1).data);
      const blue = Array.from(context.getImageData(4, 160, 1, 1).data);
      bitmap.close();
      return { red, blue };
    }, screenshot.toString("base64"));
    expect(colors.red[0] - colors.red[2]).toBeGreaterThan(60);
    expect(colors.blue[2] - colors.blue[0]).toBeGreaterThan(60);
  }
  if (browserName === "chromium") {
    const session = await page.context().newCDPSession(page);
    await session.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
    });
    expect(
      await surface.evaluate(
        (element) => getComputedStyle(element, "::before").backdropFilter,
      ),
    ).toBe("none");
    await session.detach();
  }
});

test("brand and section headings form a readable hierarchy without crowding links", async ({
  page,
}) => {
  test.setTimeout(90_000);
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto("/app/vortexopedia");
    if (width <= 960) {
      await page.getByRole("button", { name: "Open navigation menu" }).click();
    } else {
      await page.locator(".sidebar__brandLink").hover();
    }
    const brand = page.locator(".sidebar__brandName");
    await expect(brand).toHaveCSS("font-family", /Georgia/);
    const logo = page.locator(".sidebar__brandImage");
    await expect(logo).toHaveAttribute(
      "src",
      /^(data:image\/png|\/static\/image\/humanode-logo.*\.png)/,
    );
    expect(
      await logo.evaluate((el) => (el as HTMLImageElement).naturalWidth),
    ).toBeGreaterThan(0);

    for (const theme of ["sky", "light", "night", "fire"]) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      for (const group of await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("region")
        .all()) {
        const heading = group.getByRole("heading", { level: 2 });
        await expect(heading).toHaveCSS("font-size", "18px");
        await expect(heading).toHaveCSS("font-family", /Georgia/);
        await expect(heading).toHaveCSS("text-transform", "none");
        const title = (await heading.locator("span").boundingBox())!;
        const firstLink = group.getByRole("link").first();
        const label = (await firstLink
          .locator(".sidebar__label")
          .boundingBox())!;
        const row = (await firstLink.boundingBox())!;
        expect(title.x).toBe(label.x);
        expect(title.y + title.height).toBeLessThanOrEqual(row.y);
        expect(title.x + title.width).toBeLessThanOrEqual(width);
        await expect(firstLink.locator(".sidebar__label")).toHaveCSS(
          "font-size",
          "15px",
        );
      }
      await page.screenshot({ path: `/tmp/navbar-${theme}-${width}.png` });
    }
  }
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`profile activity filters stay contained and reachable at ${width}px`, async ({
    page,
  }) => {
    await mockAccount(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/app/profile");
    const activity = page.locator(".glassy-section", {
      has: page.getByRole("heading", {
        name: "Governance activity",
        exact: true,
      }),
    });
    await expect(activity.getByText("No activity to show yet.")).toBeVisible();
    const controls = activity.locator(".profile-activity-controls");
    await expect(controls).toHaveCSS("overflow-x", "auto");
    const section = (await activity.boundingBox())!;
    expect(section.x + section.width).toBeLessThanOrEqual(width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await activity
      .getByRole("button", { name: "Formation", exact: true })
      .click();
    await expect(
      activity.getByRole("button", { name: "Formation", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      activity.getByRole("link", { name: "Full History" }),
    ).toBeVisible();
    await activity.getByRole("link", { name: "Full History" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/app/human-nodes/${accountAddress}/history$`),
    );
  });
}

for (const width of [390, 768, 960, 961, 1024, 1440]) {
  test(`every page reserves the compact rail with stationary content at ${width}px`, async ({
    page,
    browserName,
  }) => {
    test.setTimeout(browserName === "webkit" ? 240_000 : 120_000);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/app/vortexopedia");
    const destinations = await page
      .locator(".sidebar__nav a")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")!));
    for (const path of destinations) {
      await page.goto(path);
      await page.mouse.move(width - 20, 20);
      const main = page.locator("#main");
      await expect(main, `${path} at ${width}px`).toBeVisible();
      const measure = () =>
        main.evaluate((element) => {
          const main = element.getBoundingClientRect();
          const shell = element.closest(".app-shell")!.getBoundingClientRect();
          return { x: main.x, width: main.width, shellWidth: shell.width };
        });
      const before = await measure();
      expect(before.x).toBe(width > 960 ? 88 : 0);
      expect(before.width).toBe(before.shellWidth - before.x);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth), {
          message: `${path} must fit within ${width}px`,
        })
        .toBeLessThanOrEqual(width);
      if (width <= 960) continue;
      await expect(page.locator(".main-atmosphere")).toHaveCSS("left", "88px");
      await page.locator(".sidebar__brandLink").hover();
      const surface = page.locator(".sidebar__surface");
      await expect(surface).toHaveCSS("width", "260px");
      await expect
        .poll(() =>
          surface.evaluate(
            (element) => getComputedStyle(element, "::before").opacity,
          ),
        )
        .toBe("1");
      const after = await measure();
      expect(after.x).toBe(before.x);
      // Async page content can introduce a classic scrollbar between measurements.
      expect(after.width - before.width).toBe(
        after.shellWidth - before.shellWidth,
      );
      expect((await surface.boundingBox())!.width).toBeGreaterThan(before.x);
      const feed = page.locator(".sidebar__nav a").first();
      await feed.hover();
      expect(
        await feed.evaluate((link) => {
          const box = link.getBoundingClientRect();
          return link.contains(
            document.elementFromPoint(box.right - 4, box.y + box.height / 2),
          );
        }),
      ).toBe(true);
      await page.mouse.move(width - 20, 20);
      await expect(surface).toHaveCSS("width", "88px");
      expect((await main.boundingBox())!.x).toBe(before.x);
    }
  });
}

test("keyboard focus reveals labels and mobile keeps a labeled menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/app/feed");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  const rail = page.locator(".sidebar");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Formation" })
    .focus();
  await expect(rail).toHaveClass(/sidebar--expanded/);

  await page.setViewportSize({ width: 390, height: 844 });
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav).toBeHidden();
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(nav.getByRole("link", { name: "Humanode Codex" })).toBeVisible();
  await nav.getByRole("link", { name: "Settings" }).scrollIntoViewIfNeeded();
  await expect(nav.getByRole("link", { name: "Settings" })).toBeInViewport();
});

test("short screens can scroll to the final icon", async ({ page }) => {
  await mockAccount(page);
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.goto("/app/feed");
  const rail = page.locator(".sidebar");
  const settings = page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Settings" });
  await expect(page.locator(".sidebar__nav")).toHaveCSS(
    "scrollbar-width",
    "none",
  );
  await settings.scrollIntoViewIfNeeded();
  await settings.hover();
  await expect(settings).toBeInViewport();
  await expect(rail).toHaveClass(/sidebar--expanded/);

  await page.mouse.move(500, 300);
  await expect(rail).not.toHaveClass(/sidebar--expanded/);
});

test("mobile focus leaving navigation reveals the newly focused page control", async ({
  page,
}) => {
  await mockAccount(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/vortexopedia");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Settings", exact: true })
    .focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("searchbox", { name: "Search terms" }),
  ).toBeFocused();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
});

test("a mobile menu does not reopen after a desktop round trip", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/vortexopedia");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".sidebar")).not.toHaveClass(/sidebar--mobileOpen/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
});

for (const [width, height] of [
  [390, 844],
  [844, 390],
  [1440, 900],
]) {
  test(`linked definitions remain below the header at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    for (const [path, selector] of [
      ["/app/vortexopedia?term=human_node", '[data-term-id="human_node"]'],
      ["/app/humanode-codex?clause=HC-2.1", '[id="HC-2.1"]'],
    ]) {
      await page.goto(path);
      const target = page.locator(selector);
      await expect(target).toBeVisible();
      await expect
        .poll(async () => {
          const targetBox = (await target.boundingBox())!;
          const header = (await page.locator(".sidebar").boundingBox())!;
          // WebKit rounds scroll offsets to whole pixels; layout can remain fractional.
          return (
            targetBox.y + 1 >= (width <= 960 ? header.y + header.height : 0)
          );
        })
        .toBe(true);
    }
  });
}

for (const failRefresh of [false, true]) {
  test(`disconnect survives stale refresh${failRefresh ? " and a failed verification read" : ""}`, async ({
    page,
  }) => {
    const state = await mockAccount(page);
    await page.clock.install();
    let holdNext = false;
    let release: (() => Promise<void>) | undefined;
    let receive: () => void;
    const heldRequest = new Promise<void>((resolve) => {
      receive = resolve;
    });
    await page.route("**/api/me", async (route) => {
      if (holdNext) {
        holdNext = false;
        release = () =>
          route.fulfill({
            json: {
              authenticated: true,
              address: accountAddress,
              gate: { eligible: true, expiresAt: "2099-01-01T00:00:00Z" },
            },
          });
        receive();
      } else if (!state.authenticated && failRefresh) {
        await route.fulfill({
          status: 503,
          json: { message: "Verification unavailable" },
        });
      } else await route.fallback();
    });
    await page.goto("/app/vortexopedia");
    await expect(accountTrigger(page)).toBeEnabled();
    holdNext = true;
    await page.clock.fastForward(60000);
    await heldRequest;
    await accountTrigger(page).click();
    await page.getByRole("button", { name: "Disconnect", exact: true }).click();
    const connect = page.getByRole("button", {
      name: "Connect wallet",
      exact: true,
    });
    await expect(connect).toBeEnabled();
    const response = page.waitForResponse(
      (res) => new URL(res.url()).pathname === "/api/me",
    );
    await release!();
    await response;
    await page.clock.runFor(50);
    await expect(connect).toBeEnabled();
    await expect(accountTrigger(page)).toHaveCount(0);
  });
}

async function mockUrgentRecords(page: Page) {
  await mockAccount(page);
  const items = Array.from({ length: 20 }, (_, index) => ({
    id: `urgent-project-${index}`,
    title: `Urgent project ${index + 1}`,
    meta: "Formation",
    stage: "build",
    summaryPill: "Formation",
    summary: "Review this project.",
    actionable: true,
    proposerId: accountAddress,
    href: `/app/proposals/urgent-project-${index}/formation`,
    timestamp: new Date(Date.UTC(2026, 9, 2, 0, index)).toISOString(),
  }));
  await page.route("**/api/my-governance*", (route) =>
    route.fulfill({
      json: { myChamberIds: ["general"], opportunityAccounting: null },
    }),
  );
  await page.route("**/api/feed*", (route) =>
    route.fulfill({
      json: {
        items:
          new URL(route.request().url()).searchParams.get("stage") === "build"
            ? items
            : [],
      },
    }),
  );
}

for (const mode of ["button", "scroll"]) {
  test(`every urgent item counted by the badge can be reached using ${mode}`, async ({
    page,
  }) => {
    await mockUrgentRecords(page);
    if (mode === "button")
      await page.addInitScript(() => {
        window.IntersectionObserver = class extends IntersectionObserver {
          observe() {}
        };
      });
    await page.goto("/app/feed");
    await expect(page.locator(".sidebar__countBadge")).toHaveText("20");
    const records = page.getByRole("region", {
      name: "Governance feed records",
    });
    await expect(
      records.getByText(/^Urgent project \d+$/).first(),
    ).toBeVisible();
    for (let index = 0; index < 4; index++) {
      const count = await records.getByText(/^Urgent project \d+$/).count();
      if (count === 20) break;
      if (mode === "button")
        await page
          .getByRole("button", { name: "Load more", exact: true })
          .click();
      await expect
        .poll(async () => {
          if (mode === "scroll")
            await page.evaluate(() =>
              window.scrollTo(0, document.documentElement.scrollHeight),
            );
          return records.getByText(/^Urgent project \d+$/).count();
        })
        .toBeGreaterThan(count);
    }
    await expect(records.getByText(/^Urgent project \d+$/)).toHaveCount(20);
    await expect(
      page.getByRole("button", { name: "Load more", exact: true }),
    ).toHaveCount(0);
  });
}

for (const width of [390, 1440]) {
  test(`shared search filters dismiss and retain keyboard focus at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/app/vortexopedia");
    const search = page.getByRole("searchbox", { name: "Search terms" });
    await search.fill("governor");
    await expect(
      page.getByRole("combobox", { name: "Category", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Sort by", exact: true }),
    ).toBeVisible();
    await page.getByRole("combobox", { name: "Category", exact: true }).focus();
    await page.keyboard.press("Escape");
    await expect(search).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Apply", exact: true }),
    ).toHaveCount(0);
    await search.click();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(search).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Apply", exact: true }),
    ).toHaveCount(0);
    await search.click();
    await page.locator('[data-term-id="governor"] button').click();
    await expect(
      page.getByRole("button", { name: "Apply", exact: true }),
    ).toHaveCount(0);
    await search.click();
    const terms = page.locator('[data-term-id="governor"] button');
    await terms.focus();
    await expect(
      page.getByRole("button", { name: "Apply", exact: true }),
    ).toHaveCount(0);
  });
}

test("a failed governance lookup is reported rather than shown as an empty feed", async ({
  page,
}) => {
  await mockAccount(page);
  await page.route("**/api/my-governance*", (route) =>
    route.fulfill({ status: 503, json: { message: "Governance unavailable" } }),
  );
  await page.goto("/app/feed");
  await expect(page.getByRole("alert")).toContainText("Feed unavailable");
  await expect(
    page.getByText("No feed activity yet.", { exact: true }),
  ).toHaveCount(0);
});

test("a pending activity page cannot leak into a newly selected feed scope", async ({
  page,
}) => {
  await mockAccount(page);
  let release: (() => Promise<void>) | undefined;
  let receive: () => void;
  const pending = new Promise<void>((resolve) => {
    receive = resolve;
  });
  const event = (id: string) => ({
    id,
    title: id,
    meta: "System",
    stage: "system",
    summary: "A recorded system event.",
    summaryPill: "System",
    timestamp: "2026-10-02T00:00:00Z",
    actionable: false,
  });
  await page.route("**/api/my-governance*", (route) =>
    route.fulfill({
      json: { myChamberIds: ["general"], opportunityAccounting: null },
    }),
  );
  await page.route("**/api/feed*", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.has("cursor")) {
      release = () =>
        route.fulfill({
          json: { items: [event("Delayed all-activity record")] },
        });
      receive();
    } else if (
      !url.searchParams.has("stage") &&
      !url.searchParams.has("excludeStages")
    ) {
      await route.fulfill({
        json: { items: [event("All-activity record")], nextCursor: "all-next" },
      });
    } else if (url.searchParams.get("stage") === "system") {
      await route.fulfill({
        json: { items: [event("Current system record")] },
      });
    } else await route.fulfill({ json: { items: [] } });
  });
  await page.goto("/app/feed");
  await page.getByRole("button", { name: "All activity", exact: true }).click();
  await pending;
  await page.getByRole("button", { name: "System", exact: true }).click();
  await expect(
    page.getByText("Current system record", { exact: true }),
  ).toBeVisible();
  await release!();
  await page.waitForTimeout(100);
  await expect(
    page.getByText("Delayed all-activity record", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Current system record", { exact: true }),
  ).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`sidebar navigation starts the next page at the top at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/app/vortexopedia");
    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500);
    if (width <= 960)
      await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(1200);
    const previousScroll = await page.evaluate(() => scrollY);
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Humanode Codex", exact: true })
      .click();
    await expect(page).toHaveURL("/app/humanode-codex");
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    const heading = page.getByRole("heading", { name: "Humanode Codex" });
    await expect(heading).toBeInViewport();
    await page.goBack();
    await expect(page).toHaveURL("/app/vortexopedia");
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(previousScroll);
  });
}

for (const destination of ["profile", "public identity"] as const) {
  for (const width of [390, 1440]) {
    test(`wallet ${destination} navigation starts at the top and preserves history at ${width}px`, async ({
      page,
    }) => {
      await mockAccount(page);
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/app/vortexopedia");
      await page.evaluate(() => window.scrollTo(0, 1200));
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(1200);
      if (width <= 960) {
        await page
          .getByRole("button", { name: "Open navigation menu" })
          .click();
      }
      await accountTrigger(page).click();
      const wallet = page.getByRole("dialog", { name: "Wallet", exact: true });
      const link =
        destination === "profile"
          ? wallet.getByRole("link", { name: "View profile" })
          : wallet.locator(".sidebar__authAddress a");
      await link.click();
      await expect(page).toHaveURL(
        destination === "profile"
          ? "/app/profile"
          : `/app/human-nodes/${accountAddress}`,
      );
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await expect(wallet).toHaveCount(0);
      if (width <= 960) {
        await expect(page.locator(".sidebar")).not.toHaveClass(
          /sidebar--mobileOpen/,
        );
      }
      await page.goBack();
      await expect(page).toHaveURL("/app/vortexopedia");
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(1200);
    });
  }
}

test("urgent pagination keeps filtered pages pending and allows explicit retry", async ({
  page,
}) => {
  await mockAccount(page);
  let failNext = true;
  let attempts = 0;
  await page.route("**/api/my-governance*", (route) =>
    route.fulfill({
      json: { myChamberIds: ["general"], opportunityAccounting: null },
    }),
  );
  await page.route("**/api/feed*", (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("cursor") === "next-build") {
      attempts++;
      return route.fulfill(
        failNext
          ? { status: 503, json: { error: { message: "Retry this page" } } }
          : {
              json: {
                items: [
                  {
                    id: "retried-project",
                    title: "Project reached after retry",
                    meta: "Formation",
                    stage: "build",
                    actionable: true,
                    proposerId: accountAddress,
                    href: "/app/proposals/retried-project/formation",
                    timestamp: "2026-10-02T00:00:00Z",
                  },
                ],
              },
            },
      );
    }
    return route.fulfill({
      json: {
        items: [],
        nextCursor:
          url.searchParams.get("stage") === "build" ? "next-build" : null,
      },
    });
  });
  await page.goto("/app/feed");
  const feedError = page.locator(".feed-page__status--error");
  await expect(feedError).toContainText("Retry this page");
  await expect(
    page.getByText("No feed activity yet.", { exact: true }),
  ).toHaveCount(0);
  await page.waitForTimeout(250);
  expect(attempts).toBe(1);
  failNext = false;
  await page.getByRole("button", { name: "Load more", exact: true }).click();
  await expect(
    page.getByText("Project reached after retry", { exact: true }),
  ).toBeVisible();
  await expect(feedError).toHaveCount(0);
  expect(attempts).toBe(2);
});
