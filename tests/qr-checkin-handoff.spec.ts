import { test, expect } from "@playwright/test";

const student = { id: "qa-student", name: "QA Student", email: "qa.student@example.test", role: "STUDENT", schoolId: "qa-school" };

test("signed-out QR scan returns to check-in after password login", async ({ page }) => {
  let loggedIn = false;
  await page.route("**/api/auth/me", (route) => route.fulfill({ status: loggedIn ? 200 : 401, contentType: "application/json", body: JSON.stringify(loggedIn ? student : { error: "Unauthorized" }) }));
  await page.route("**/api/auth/login", (route) => { loggedIn = true; return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ token: "synthetic", user: student }) }); });
  await page.goto("/qr-checkin#token=synthetic-qr", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fqr-checkin/);
  await page.locator("#login-email").fill(student.email);
  await page.locator("#login-password").fill("synthetic-password");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/qr-checkin$/);
  await expect(page.getByRole("textbox", { name: "Attendance code" })).toHaveValue("synthetic-qr");
});

test("second QR scanned in the same tab replaces the first code and resolved session", async ({ page }) => {
  const used: string[] = [];
  await page.route("**/api/auth/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(student) }));
  await page.route("**/api/sessions/qr-resolve", async (route) => {
    const token = (route.request().postDataJSON() as { token: string }).token;
    used.push(token);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ sessionId: `session-${token}` }) });
  });
  await page.route("**/api/sessions/*/qr-checkin", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.goto("/qr-checkin#token=first-qr", { waitUntil: "networkidle" });
  await expect(page.getByRole("textbox", { name: "Attendance code" })).toHaveValue("first-qr");
  await page.getByRole("button", { name: "Check in" }).click();
  await expect(page.getByRole("status")).toHaveText("You are checked in.");
  await page.evaluate(() => { window.location.hash = "token=second-qr"; });
  await expect(page.getByRole("textbox", { name: "Attendance code" })).toHaveValue("second-qr");
  await page.getByRole("button", { name: "Check in" }).click();
  await expect.poll(() => used).toEqual(["first-qr", "second-qr"]);
});

test("Google callback returns a scanned student to QR check-in", async ({ page }) => {
  let loggedIn = false;
  await page.route("**/api/auth/me", (route) => route.fulfill({ status: loggedIn ? 200 : 401, contentType: "application/json", body: JSON.stringify(loggedIn ? student : { error: "Unauthorized" }) }));
  await page.route("**/api/auth/google/callback*", (route) => { loggedIn = true; return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ token: "synthetic", user: student }) }); });
  await page.goto("/qr-checkin#token=google-qr", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Sign in" }).click();
  await page.goto("/login?code=synthetic-code&state=login", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/qr-checkin$/);
  await expect(page.getByRole("textbox", { name: "Attendance code" })).toHaveValue("google-qr");
});

test("login ignores an untrusted return destination", async ({ page }) => {
  let loggedIn = false;
  await page.route("**/api/auth/me", (route) => route.fulfill({ status: loggedIn ? 200 : 401, contentType: "application/json", body: JSON.stringify(loggedIn ? student : { error: "Unauthorized" }) }));
  await page.route("**/api/auth/login", (route) => { loggedIn = true; return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ token: "synthetic", user: student }) }); });
  await page.goto("/login?returnTo=https%3A%2F%2Fevil.example%2F", { waitUntil: "networkidle" });
  await page.locator("#login-email").fill(student.email);
  await page.locator("#login-password").fill("synthetic-password");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
