import { test, expect } from "@playwright/test";

test("public entry copy accurately limits 13+ eligibility to students", async ({ page }) => {
  await page.goto("/signup", { waitUntil: "networkidle" });
  await expect(page.getByText(/student accounts are limited to people age 13 or older/i)).toBeVisible();
  await page.goto("/terms", { waitUntil: "networkidle" });
  await expect(page.getByText(/student accounts are available only to students who are 13 or older/i)).toBeVisible();
});

test("public privacy copy does not promise a disabled parent progress view", async ({ page }) => {
  await page.goto("/privacy", { waitUntil: "networkidle" });
  await expect(page.locator("#how-we-share p").filter({ hasText: /self-service parent progress links are currently disabled/i })).toBeVisible();
  await expect(page.getByText(/parents and guardians.*school-controlled records access/i)).toBeVisible();
  await expect(page.getByText(/pending student invitations may hold roster data before acceptance/i)).toBeVisible();
  await expect(page.getByText(/and parent progress views/i)).toHaveCount(0);
});

test("privacy policy discloses temporary tab-local QR code storage used for sign-in", async ({ page }) => {
  await page.route("**/api/auth/me", (route) => route.fulfill({ status: 401, contentType: "application/json", body: '{"error":"Unauthorized"}' }));
  await page.goto("/qr-checkin#token=synthetic-qr", { waitUntil: "networkidle" });
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("qr-checkin-token"))).toBe("synthetic-qr");
  await page.goto("/privacy", { waitUntil: "networkidle" });
  await expect(page.getByText(/attendance QR code.*temporarily stored in this tab.*sessionStorage.*survives sign-in/i)).toBeVisible();
  await expect(page.getByText(/removed after a successful check-in, replaced by a new scan, or cleared when the tab is closed/i)).toBeVisible();
});

test("student eligibility setup describes the student-only age rule", async ({ page }) => {
  await page.route("**/api/auth/me", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ id: "qa-student", name: "QA Student", email: "student@example.test", role: "STUDENT", requiresEligibilityAttestation: true }),
  }));
  await page.goto("/dashboard", { waitUntil: "networkidle" });
  await expect(page.getByText(/student accounts are available to people who are 13 or older/i)).toBeVisible();
});
