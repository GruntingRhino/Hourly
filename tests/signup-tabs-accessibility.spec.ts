import { test, expect } from "@playwright/test";

test("signup tabs support arrow, Home, and End keys", async ({ page }) => {
  await page.goto("/signup", { waitUntil: "networkidle" });
  const school = page.getByRole("tab", { name: /school administrator/i });
  const student = page.getByRole("tab", { name: /^student/i });
  const partner = page.getByRole("tab", { name: /community organization/i });
  await school.focus();
  await page.keyboard.press("ArrowRight");
  await expect(student).toBeFocused();
  await expect(student).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("Join with an invitation");
  await page.keyboard.press("End");
  await expect(partner).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(school).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("Home");
  await expect(school).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(partner).toBeFocused();
});
