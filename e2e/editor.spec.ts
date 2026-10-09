import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const ready = () => (window as Window & { __sceneReady?: boolean }).__sceneReady === true;
const SCENE = "e2e-editor";
const FILE = resolve("scenes", `${SCENE}.json`);

test.afterEach(() => {
  if (existsSync(FILE)) rmSync(FILE);
});

test("places an item, moves it and saves the scene file", async ({ page }) => {
  await page.goto("/?preset=chambre-parents");
  await page.waitForFunction(ready, null, { timeout: 90_000 });

  await page.getByTestId("kind-select").selectOption("bed");
  await page.getByTestId("add-item").click();
  await expect(page.getByTestId("selected-id")).toContainText("chambre-parents");

  await page.getByTestId("pos-x").fill("250");
  await page.getByTestId("rot").fill("90");
  await page.getByTestId("finish-floor").selectOption("parquet-walnut");

  await page.getByTestId("save-as-name").fill(SCENE);
  await page.getByTestId("save-as").click();
  await expect(page.getByTestId("editor-panel")).toContainText(`Enregistré dans scenes/${SCENE}.json`);

  const saved = JSON.parse(readFileSync(FILE, "utf8"));
  expect(saved.name).toBe(SCENE);
  expect(saved.items).toHaveLength(1);
  expect(saved.items[0].position[0]).toBe(250);
  expect(saved.items[0].rotationY).toBe(90);
  expect(saved.items[0].asset.procedural).toBe("bed");
  expect(saved.roomFinishes["chambre-parents"].floor).toBe("parquet-walnut");
});

test("loads the base scene from the URL", async ({ page }) => {
  await page.goto("/?preset=sejour-cuisine-2&scene=base");
  await page.waitForFunction(ready, null, { timeout: 90_000 });
  await expect(page.getByTestId("editor-panel")).toContainText("Scène « base »");
  await expect(page.getByTestId("editor-panel")).toContainText("objets");
});
