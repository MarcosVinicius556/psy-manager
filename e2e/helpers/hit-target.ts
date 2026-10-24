import { expect, type Locator } from "@playwright/test";

/** Ensures nothing (e.g. a closing drawer backdrop) covers the center of the control. */
export async function expectReceivesPointerAtCenter(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
  const receives = await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    let y = rect.top + rect.height / 2;
    const stickyHeader = document.querySelector<HTMLElement>("header.sticky, header.landing");
    if (stickyHeader) {
      const hb = stickyHeader.getBoundingClientRect();
      if (y < hb.bottom + 2) y = Math.min(rect.bottom - 2, hb.bottom + 8);
    }
    const top = document.elementFromPoint(x, y);
    if (!top) return false;
    return top === el || el.contains(top);
  });
  expect(receives).toBe(true);
}
