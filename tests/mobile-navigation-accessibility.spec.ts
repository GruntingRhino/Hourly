import { test, expect } from "@playwright/test";

test("mobile overflow navigation exposes its state and supports Escape", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route("**/api/auth/me", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "qa-admin", name: "QA Admin", email: "qa@example.test", role: "SCHOOL_ADMIN", schoolId: "qa-school", school: { name: "QA School", ownershipStatus: "APPROVED", onboardingComplete: true } }) }));
  await page.route("**/api/messages/notifications/unread-count", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ unread: 0 }) }));
  await page.goto("/dashboard", { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "More navigation items" });
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("link", { name: "Attendance QR" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});
