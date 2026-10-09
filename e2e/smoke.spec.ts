import { expect, test } from "@playwright/test";

test("renders the empty scene with a canvas and camera presets", async ({ page }) => {
  await page.goto("/?preset=overview");
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForFunction(() => (window as Window & { __sceneReady?: boolean }).__sceneReady === true, null, { timeout: 30_000 });
  await expect(page.getByTestId("preset-select")).toHaveValue("overview");
});
