import { expect, test } from "@playwright/test";

for (const width of [390, 768, 1024, 1440]) {
  test(`Vortexopedia entries keep a shared left edge at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/app/vortexopedia");
    const entries = page.locator("[data-term-id]");
    await expect(entries.first()).toBeVisible();

    const offsets = await entries.evaluateAll((cards) =>
      cards.map((card) => {
        const button = card.querySelector("button")!;
        const header = button.firstElementChild!;
        const bounds = button.getBoundingClientRect();
        const content = header.getBoundingClientRect();
        return {
          left: Math.abs(content.left - bounds.left),
          right: Math.abs(content.right - bounds.right),
        };
      }),
    );
    for (const offset of offsets) {
      expect(offset.left).toBeLessThan(1);
      expect(offset.right).toBeLessThan(1);
    }

    const entry = entries.first();
    const trigger = entry.getByRole("button");
    const titleBefore = await entry.getByRole("heading").boundingBox();
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const details = entry.getByText("Details", { exact: true });
    await expect(details).toBeVisible();
    const titleAfter = await entry.getByRole("heading").boundingBox();
    const detailBounds = await details.boundingBox();
    expect(titleAfter!.x).toBeCloseTo(titleBefore!.x, 0);
    expect(titleAfter!.x).toBeCloseTo(detailBounds!.x, 0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false);
    await trigger.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(details).toBeHidden();
  });
}
