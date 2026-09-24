import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("privacy tables are keyboard accessible on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/privacy", { waitUntil: "networkidle" });
  await expect(page.locator("#data-collected")).toBeVisible();
  for (const name of ["Information we collect table", "Role-based data access table", "Service providers table"]) {
    const region = page.getByRole("region", { name });
    await region.focus();
    await expect(region).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(region).toBeFocused();
  }
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.passes.length + results.violations.length + results.incomplete.length).toBeGreaterThan(0);
  expect(results.violations.filter((v) => v.impact === "critical" || v.impact === "serious")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
