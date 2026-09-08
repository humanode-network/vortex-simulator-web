import { expect, test, type Locator } from "@playwright/test";
import type { ProposalListItemDto } from "../../src/types/api";

const proposals: ProposalListItemDto[] = [
  { title: "Short title", summary: "A short summary." },
  {
    title: "A longer proposal title that wraps across several lines",
    summary: "Full proposal context remains readable when expanded. ".repeat(
      20,
    ),
  },
  { title: "No summary", summary: "" },
  {
    title: "An initiative proposal",
    summary: "Supporting proposal details. ".repeat(12),
    initiative: { id: "test-initiative", title: "Community research" },
  },
].map((content, index) => ({
  id: `alignment-${index}`,
  meta: "General chamber",
  chamber: index === 2 ? "Long chamber name ".repeat(6) : "General chamber",
  stage: "citizen_veto",
  summaryPill: "Citizen veto",
  stageData: [],
  stats: [],
  proposer: "Test author",
  proposerId: "test-author",
  tier: "Citizen",
  proofFocus: "pog",
  tags: [],
  keywords: [],
  date: "2026-09-08",
  votes: 0,
  activityScore: 0,
  ctaPrimary: "Open proposal",
  ctaSecondary: "",
  ...content,
}));

async function geometry(card: Locator) {
  return card.evaluate((element) => {
    const header = element.querySelector(".glassy-record-card__button")!;
    const bounds = header.getBoundingClientRect();
    const selectors = ["metaPill", "stage", "time", "chevron"];
    return selectors.map((suffix) => {
      const item = header.querySelector(`.glassy-record-card__${suffix}`)!;
      const rect = item.getBoundingClientRect();
      return {
        x: rect.x - bounds.x,
        y: rect.y - bounds.y,
        centerOffset: rect.y + rect.height / 2 - bounds.y - bounds.height / 2,
      };
    });
  });
}

test("proposal metadata centers on collapsed cards and stays fixed on expansion", async ({
  page,
}) => {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/proposals") {
      await route.fulfill({ json: { items: proposals } });
    } else if (path.endsWith("/citizen-veto")) {
      await route.fulfill({
        json: {
          stats: [],
          stageData: [],
          attemptsUsed: 0,
          attemptsRemaining: 1,
        },
      });
    } else {
      await route.fulfill({ json: { authenticated: false } });
    }
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/app/proposals");
  const cards = page.locator(".glassy-record-card");
  await expect(cards).toHaveCount(proposals.length);

  for (const width of [1440, 1920, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const card of await cards.all()) {
      await expect
        .poll(async () =>
          Math.max(
            ...(await geometry(card)).map((g) => Math.abs(g.centerOffset)),
          ),
        )
        .toBeLessThan(1);
      const before = await geometry(card);
      await card.locator(".glassy-record-card__button").click();
      await expect(card.locator(".glassy-record-card__details")).toBeVisible();
      const after = await geometry(card);
      for (let i = 0; i < before.length; i++) {
        expect(after[i].x).toBeCloseTo(before[i].x, 0);
        expect(after[i].y).toBeCloseTo(before[i].y, 0);
      }
      await card.locator(".glassy-record-card__button").click();
    }
  }

  for (const width of [390, 768, 1024]) {
    await page.setViewportSize({ width, height: 1000 });
    await cards.first().locator(".glassy-record-card__button").click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await cards.first().locator(".glassy-record-card__button").click();
  }
});
