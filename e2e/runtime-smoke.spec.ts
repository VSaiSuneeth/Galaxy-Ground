import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/explore",
  "/missions",
  "/launch/isro-gaganyaan-g1",
  "/startups",
  "/communities",
  "/community/astrophotography",
  "/community/rocket-engineering",
  "/learning",
  "/bookmarks",
  "/profile",
];

test("major public routes render without browser runtime errors", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];

  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error") {
      if (!text.includes("featured_content") && !text.includes("posts query failed")) {
        errors.push(`console: ${text}`);
      }
    }
  });
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() >= 400 && !url.includes("/bookmarks") && !url.includes("/featured_content")) {
      errors.push(`http ${response.status()}: ${url}`);
    }
  });

  for (const route of routes) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1_500);
    expect(response?.status(), `${route} should respond`).toBeLessThan(400);
    await expect(page.locator("body")).not.toContainText("Page failed to render");
    await expect(page.locator("body")).not.toContainText("Cannot read properties of undefined");
  }

  expect(errors).toEqual([]);
});
