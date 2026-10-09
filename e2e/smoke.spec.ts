import { expect, test } from "@playwright/test";

const ready = () => (window as Window & { __sceneReady?: boolean }).__sceneReady === true;

test("renders the overview with a canvas and camera presets", async ({ page }) => {
  await page.goto("/?preset=overview");
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForFunction(ready, null, { timeout: 30_000 });
  await expect(page.getByTestId("preset-select")).toHaveValue("overview");
  await expect(page.getByTestId("level-select")).toHaveValue("all");
});

test("renders a room preset on its level with room labels", async ({ page }) => {
  await page.goto("/?preset=sejour-cuisine");
  await page.waitForFunction(ready, null, { timeout: 30_000 });
  await expect(page.getByTestId("level-select")).toHaveValue("rez");
  await expect(page.locator("[data-room='sejour-cuisine']")).toHaveText("SEJOUR - CUISINE");
  await expect(page.locator("[data-room='chambre-parents']")).toHaveCount(0);
});
