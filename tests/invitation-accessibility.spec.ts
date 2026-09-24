import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const [path, response] of [
  ["/join/beneficiary?token=synthetic", { beneficiaryName: "QA Partner", schoolName: "QA School", sentTo: "partner@example.test", beneficiaryId: "qa-id" }],
  ["/join/admin?token=synthetic", { beneficiaryName: "QA Partner", email: "partner@example.test", hasExistingAccount: false }],
] as const) {
  test(`${path} has named invitation form controls`, async ({ page }) => {
    await page.route(/\/api\/invitations\/(beneficiary|beneficiary-admin)\?/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(response) });
    });
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /accept.*create|creating account/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /your name/i })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.passes.length + results.violations.length + results.incomplete.length).toBeGreaterThan(0);
    expect(results.violations.filter((v) => ["critical", "serious"].includes(v.impact || "")).map((v) => v.id)).toEqual([]);
  });
}
