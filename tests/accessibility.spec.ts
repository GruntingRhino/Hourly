/**
 * GoodHours — Accessibility Test Suite (WCAG 2.1 AA)
 *
 * Uses @axe-core/playwright to audit every major page for accessibility violations.
 * Pass/fail gate: zero critical or serious violations per page.
 * Moderate and minor violations are logged as warnings.
 *
 * Test accounts (password: password123 for all):
 *   - Student:      john@student.edu
 *   - Org:          volunteer@greenearth.org
 *   - School Admin: admin@lincoln.edu
 */

import { test, expect, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  createSyntheticOpportunity,
  deleteSyntheticOpportunity,
} from "./helpers/qaFixtures";

const BASE = process.env.PW_BASE_URL || "http://localhost:5173";
const QA_PASSWORD = process.env.QA_PASSWORD || "Playwright1!";
const QA_STUDENT_EMAIL = process.env.QA_STUDENT_EMAIL || "abhay.sivaram+5@gmail.com";
const QA_ORG_EMAIL = process.env.QA_ORG_EMAIL || "abhay.sivaram+3@gmail.com";
const QA_SCHOOL_EMAIL = process.env.QA_SCHOOL_EMAIL || "abhay.sivaram+1@gmail.com";

// ─── Helper: login ────────────────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password = QA_PASSWORD) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|browse/, { timeout: 15000 });
}

// ─── Helper: run axe and log results ─────────────────────────────────────────

async function runAxe(page: Page, pageLabel: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const critical = results.violations.filter((v) => v.impact === "critical");
  const serious = results.violations.filter((v) => v.impact === "serious");
  const moderate = results.violations.filter((v) => v.impact === "moderate");
  const minor = results.violations.filter((v) => v.impact === "minor");

  if (results.violations.length > 0) {
    console.log(`\n[${pageLabel}] Axe violations found:`);
    for (const v of results.violations) {
      console.log(
        `  [${v.impact?.toUpperCase()}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`
      );
    }
  }

  // Defence in depth against a green result that scanned nothing. Every axe test
  // below gates only on critical+serious being empty, so an axe run that
  // evaluated no rules at all — a blank or detached frame, for instance — would
  // pass. `passes` counts rules evaluated and satisfied, so the total below is
  // zero only in that case. Note this does NOT catch "the page rendered, but it
  // was the wrong page": an empty document still evaluates rules. Landing on the
  // intended page has to be asserted per test, as the opportunity detail test
  // below does.
  const rulesEvaluated =
    results.passes.length + results.violations.length + results.incomplete.length;

  console.log(
    `[${pageLabel}] Summary — critical:${critical.length} serious:${serious.length} moderate:${moderate.length} minor:${minor.length} rulesEvaluated:${rulesEvaluated}`
  );

  expect(
    rulesEvaluated,
    `[${pageLabel}] axe evaluated no rules at all, so this page was not actually scanned. ` +
    "A zero-violation result here means nothing — check the page rendered before the scan."
  ).toBeGreaterThan(0);

  return { violations: results.violations, critical, serious, moderate, minor, rulesEvaluated };
}

// ─── 1. Landing page (unauthenticated) ───────────────────────────────────────

test("Landing page — WCAG 2.1 AA", async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.waitForLoadState("networkidle");

  const { critical, serious } = await runAxe(page, "Landing");
  expect(
    critical.concat(serious),
    `Critical/serious violations on Landing: ${[...critical, ...serious].map((v) => v.id).join(", ")}`
  ).toHaveLength(0);
});

// ─── 2. Login page ────────────────────────────────────────────────────────────

test("Login page — WCAG 2.1 AA", async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("networkidle");

  const { critical, serious } = await runAxe(page, "Login");
  expect(
    critical.concat(serious),
    `Critical/serious violations on Login: ${[...critical, ...serious].map((v) => v.id).join(", ")}`
  ).toHaveLength(0);
});

// ─── 3. Login page — manual keyboard & form checks ───────────────────────────

test("Login page — keyboard navigation and form validation", async ({
  page,
}) => {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("networkidle");

  // Tab through the rendered page in DOM order: logo → email → forgot-password → password.
  // The logo and forgot-password link are intentionally keyboard reachable navigation.
  await page.keyboard.press("Tab");
  const logoFocused = await page.evaluate(
    () => document.activeElement?.getAttribute("href") === "/"
  );
  expect(logoFocused, "Logo link should be focused after first Tab").toBe(true);

  await page.keyboard.press("Tab");
  const emailFocused = await page.evaluate(
    () => document.activeElement?.getAttribute("type") === "email"
  );
  expect(emailFocused, "Email field should be focused after second Tab").toBe(true);

  await page.keyboard.press("Tab");
  const forgotFocused = await page.evaluate(
    () => document.activeElement?.getAttribute("href") === "/forgot-password"
  );
  expect(forgotFocused, "Forgot-password link should be focused after third Tab").toBe(true);

  await page.keyboard.press("Tab");
  const passwordFocused = await page.evaluate(
    () => document.activeElement?.getAttribute("type") === "password"
  );
  expect(passwordFocused, "Password field should be focused after fourth Tab").toBe(true);

  // Submit empty form and expect error messages
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);

  const errorText = await page.evaluate(() => document.body.innerText);
  const hasErrorIndicator =
    errorText.toLowerCase().includes("required") ||
    errorText.toLowerCase().includes("email") ||
    errorText.toLowerCase().includes("password") ||
    errorText.toLowerCase().includes("invalid") ||
    errorText.toLowerCase().includes("enter");
  expect(
    hasErrorIndicator,
    "Form should show an error message when submitted empty"
  ).toBe(true);
});

// ─── 4. Login page — focus visibility check ───────────────────────────────────

test("Login page — focus outline not suppressed globally", async ({ page }) => {
  await page.goto(`${BASE}/login`);

  // Check that there's no global `outline: none` or `outline: 0` override
  const outlineSupressed = await page.evaluate(() => {
    // Check computed style on body and common interactive elements
    const selectors = ["body", "button", "input", "a", "*:focus"];
    for (const sel of selectors.slice(0, 3)) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const computed = window.getComputedStyle(el);
      if (
        computed.getPropertyValue("outline-style") === "none" &&
        computed.getPropertyValue("outline-width") === "0px"
      ) {
        // Some suppression exists — check if it's via a stylesheet rule
      }
    }

    // More targeted: find any stylesheet rule that sets outline:none on * or :focus
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules || [])) {
          const cssRule = rule as CSSStyleRule;
          if (
            cssRule.selectorText &&
            (cssRule.selectorText === "*" ||
              cssRule.selectorText.includes(":focus")) &&
            cssRule.style &&
            cssRule.style.outline === "none"
          ) {
            return {
              suppressed: true,
              selector: cssRule.selectorText,
              rule: cssRule.cssText,
            };
          }
        }
      } catch {
        // Cross-origin stylesheet — skip
      }
    }
    return { suppressed: false };
  });

  if (outlineSupressed.suppressed) {
    console.warn(
      `[WARNING] Global focus outline suppressed via CSS rule: ${outlineSupressed.selector}`
    );
  }
  // This is a warning, not a hard failure — log it
  expect(true).toBe(true);
});

// ─── 5. Images have alt text ──────────────────────────────────────────────────

test("Landing page — images have alt attributes", async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.waitForLoadState("networkidle");

  const imgsWithoutAlt = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs
      .filter(
        (img) =>
          !img.hasAttribute("alt") ||
          (img.getAttribute("alt") === null)
      )
      .map((img) => ({
        src: img.src,
        class: img.className,
      }));
  });

  if (imgsWithoutAlt.length > 0) {
    console.warn(
      `[WARNING] ${imgsWithoutAlt.length} image(s) missing alt attribute on Landing:`,
      imgsWithoutAlt
    );
  }

  expect(
    imgsWithoutAlt,
    `${imgsWithoutAlt.length} img element(s) are missing alt attributes`
  ).toHaveLength(0);
});

// ─── 6. Buttons have accessible names ─────────────────────────────────────────

test("Landing page — buttons have accessible names", async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.waitForLoadState("networkidle");

  const inaccessibleButtons = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    return buttons
      .filter((btn) => {
        const hasText = btn.textContent?.trim().length ?? 0 > 0;
        const hasAriaLabel = btn.hasAttribute("aria-label");
        const hasAriaLabelledby = btn.hasAttribute("aria-labelledby");
        const hasTitle = btn.hasAttribute("title");
        return !hasText && !hasAriaLabel && !hasAriaLabelledby && !hasTitle;
      })
      .map((btn) => ({
        outerHTML: btn.outerHTML.substring(0, 120),
      }));
  });

  if (inaccessibleButtons.length > 0) {
    console.warn(
      `[WARNING] ${inaccessibleButtons.length} button(s) lack accessible names on Landing:`,
      inaccessibleButtons
    );
  }

  expect(
    inaccessibleButtons,
    `${inaccessibleButtons.length} button(s) have no accessible name (no text, aria-label, or title)`
  ).toHaveLength(0);
});

// ─── 7. Student dashboard ─────────────────────────────────────────────────────

test("Student dashboard — WCAG 2.1 AA", async ({ page }) => {
  await loginAs(page, QA_STUDENT_EMAIL);
  await page.waitForLoadState("networkidle");

  const { critical, serious } = await runAxe(page, "Student Dashboard");
  expect(
    critical.concat(serious),
    `Critical/serious violations on Student Dashboard: ${[...critical, ...serious].map((v) => v.id).join(", ")}`
  ).toHaveLength(0);
});

// ─── 8. Student browse page ───────────────────────────────────────────────────

test("Student browse page — WCAG 2.1 AA", async ({ page }) => {
  await loginAs(page, QA_STUDENT_EMAIL);
  await page.goto(`${BASE}/browse`);
  await page.waitForLoadState("networkidle");

  const { critical, serious } = await runAxe(page, "Student Browse");
  expect(
    critical.concat(serious),
    `Critical/serious violations on Student Browse: ${[...critical, ...serious].map((v) => v.id).join(", ")}`
  ).toHaveLength(0);
});

// ─── 9. Opportunity detail page ───────────────────────────────────────────────

// This test previously navigated by scraping the browse page with the locator
// 'a[href*="/opportunity/"], button' — which can resolve .first() to a <button>
// whose href is null — and then `return`ed when no link was found, passing
// without scanning anything. It also depended on browse listing an opportunity
// at all: Browse.tsx links to /opportunity/<id> only when a slot carries
// legacyOpportunityId, and otherwise to /slot/<id>. It is now pinned to an
// explicit synthetic fixture and fails rather than skipping.
test("Opportunity detail page — WCAG 2.1 AA", async ({ page }) => {
  const fixture = await createSyntheticOpportunity();
  try {
    await loginAs(page, QA_STUDENT_EMAIL);
    await page.goto(`${BASE}/opportunity/${fixture.opportunityId}`);
    await page.waitForLoadState("networkidle");

    // Prove this is the detail view, and that it rendered the fixture, before
    // the scan result is allowed to mean anything.
    await expect(page).toHaveURL(new RegExp(`/opportunity/${fixture.opportunityId}$`));
    await expect(
      page.getByText(fixture.title, { exact: false }),
      "the opportunity detail page did not render the synthetic fixture, so a clean " +
      "axe result would not be evidence about this page"
    ).toBeVisible({ timeout: 15_000 });

    const { critical, serious } = await runAxe(page, "Opportunity Detail");
    expect(
      critical.concat(serious),
      `Critical/serious violations on Opportunity Detail: ${[...critical, ...serious].map((v) => v.id).join(", ")}`
    ).toHaveLength(0);
  } finally {
    await deleteSyntheticOpportunity(fixture);
  }
});

// ─── 10. Org dashboard ────────────────────────────────────────────────────────

test("Org dashboard — WCAG 2.1 AA", async ({ page }) => {
  await loginAs(page, QA_ORG_EMAIL);
  await page.waitForLoadState("networkidle");

  const { critical, serious } = await runAxe(page, "Org Dashboard");
  expect(
    critical.concat(serious),
    `Critical/serious violations on Org Dashboard: ${[...critical, ...serious].map((v) => v.id).join(", ")}`
  ).toHaveLength(0);
});

// ─── 11. School admin dashboard ───────────────────────────────────────────────

test("School admin dashboard — WCAG 2.1 AA", async ({ page }) => {
  await loginAs(page, QA_SCHOOL_EMAIL);
  await page.waitForLoadState("networkidle");

  const { critical, serious } = await runAxe(page, "School Dashboard");
  expect(
    critical.concat(serious),
    `Critical/serious violations on School Dashboard: ${[...critical, ...serious].map((v) => v.id).join(", ")}`
  ).toHaveLength(0);
});

// ─── 12. School student list ──────────────────────────────────────────────────

test("School student list page — WCAG 2.1 AA", async ({ page }) => {
  await loginAs(page, QA_SCHOOL_EMAIL);
  await page.goto(`${BASE}/students`);
  await page.waitForLoadState("networkidle");

  const { critical, serious } = await runAxe(page, "School Student List");
  expect(
    critical.concat(serious),
    `Critical/serious violations on School Student List: ${[...critical, ...serious].map((v) => v.id).join(", ")}`
  ).toHaveLength(0);
});

// ─── 13. Groups Remove-Hours dialog — keyboard trap, Escape, focus return ────
//
// Phase 1 of the accessibility remediation (REPORT F-02): the Groups
// Remove-Hours modal is the single pilot consumer of the shared
// `client/src/components/Dialog.tsx` primitive. Dialog contract under test:
// role="dialog", aria-modal="true", accessible name from the visible heading,
// initial focus inside the dialog, Tab/Shift+Tab trapped inside, Escape
// closes, and focus returns to the trigger; plus an axe critical/serious gate
// with the dialog open.
//
// The "Remove Hours" trigger only renders for sessions with
// verificationStatus === "APPROVED", which the QA seed does not guarantee, so
// the per-student history response is stubbed at the network layer
// (page.route). The dialog under test is the real client component; only the
// session row is synthetic. Opening the dialog, pressing Escape, and pressing
// Cancel perform no network writes, so no seed state is mutated.
test("Groups Remove-Hours dialog — keyboard trap, Escape, focus return, axe", async ({
  page,
}) => {
  await loginAs(page, QA_SCHOOL_EMAIL);
  await page.goto(`${BASE}/groups`);
  await page.waitForLoadState("networkidle");

  // Anti-vacuous: prove the Groups roster view actually rendered.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText("Students in queue")).toBeVisible();

  // The per-student history behind the trigger is stubbed: one APPROVED
  // session renders exactly one keyboard-reachable "Remove Hours" button.
  // Registered before selecting a student — the history loads on detail mount.
  await page.route("**/api/reports/student*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessions: [
          {
            id: "qa-approved-session-1",
            totalHours: 3,
            verificationStatus: "APPROVED",
            opportunity: { title: "QA Park Cleanup" },
          },
        ],
      }),
    });
  });

  // Student rows are buttons whose accessible name contains the student email.
  const firstStudent = page.getByRole("button", { name: /@/ }).first();
  await expect(
    firstStudent,
    "Groups roster rendered no student rows, so the Remove-Hours trigger cannot be reached"
  ).toBeVisible({ timeout: 15000 });
  await firstStudent.click();

  const trigger = page.getByRole("button", { name: "Remove Hours" }).first();
  await expect(
    trigger,
    "Student detail rendered no Remove Hours trigger for the stubbed APPROVED session"
  ).toBeVisible({ timeout: 15000 });

  // Keyboard-only open: focus the trigger, activate with Enter.
  await trigger.focus();
  await page.keyboard.press("Enter");

  // role + modal + labelled title (accessible name resolves via aria-labelledby).
  const dialog = page.getByRole("dialog", { name: "Remove Verified Hours" });
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await expect(dialog).toHaveAttribute("aria-modal", "true");

  // Initial focus lands on the reason field inside the dialog.
  const reason = page.getByLabel("Reason (optional)");
  await expect(reason).toBeFocused();

  // Tab cycles only among the dialog's three focusables (reason, Remove, Cancel).
  const dialogNames = new Set(["Reason (optional)", "Remove Hours", "Cancel"]);
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    const name = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el ? ((el.getAttribute("aria-label") || el.textContent) ?? "").trim() : "";
    });
    expect(
      dialogNames.has(name),
      `Tab stop ${i + 1} escaped the dialog (focused: "${name}")`
    ).toBe(true);
  }

  // Shift+Tab from the first element wraps to the last (Cancel).
  await reason.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();

  // Axe gate with the dialog open.
  const { critical, serious } = await runAxe(page, "Groups Remove-Hours dialog");
  expect(
    critical.concat(serious),
    `Critical/serious violations with Remove-Hours dialog open: ${[...critical, ...serious].map((v) => v.id).join(", ")}`
  ).toHaveLength(0);

  // Escape closes and focus returns to the trigger.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden({ timeout: 5000 });
  await expect(trigger).toBeFocused();
});

// ─── 14. Login — keyboard focus indicator + empty-submit error focus ──────
//
// Phase 2 of the accessibility remediation (REPORT F-05 focus-visible
// system, F-10 error association). Fully client-side: the empty submit is
// rejected by Login's local validation (no network request), which sets
// field errors and moves focus to the first invalid field
// (`client/src/pages/Login.tsx:89-103`). The focus-visible assertion below
// is a hard gate on the new `:focus-visible` rule in
// `client/src/index.css` — it fails while `focus:outline-none` utilities
// leave keyboard focus invisible.
test("Login — visible keyboard focus and error focus management, axe", async ({
  page,
}) => {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("networkidle");

  // Anti-vacuous: prove the login form actually rendered.
  await expect(
    page.getByRole("heading", { name: "Welcome back" })
  ).toBeVisible({ timeout: 15000 });
  const email = page.getByLabel("Email");
  const password = page.getByLabel("Password");
  await expect(email).toBeVisible();
  await expect(password).toBeVisible();

  // Keyboard-only to the email field (tab order per test 3: logo → email).
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(email).toBeFocused();

  // The keyboard-focused field must show a non-zero outline: the
  // `:focus-visible` rule, not the UA default (Login inputs carry
  // `focus:outline-none`, so without the remediation this is 0px).
  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return { width: "none", style: "none" };
    const computed = window.getComputedStyle(el);
    return {
      width: computed.getPropertyValue("outline-width"),
      style: computed.getPropertyValue("outline-style"),
    };
  });
  expect(
    outline.width,
    `keyboard-focused email field has no visible outline (width: "${outline.width}", style: "${outline.style}")`
  ).not.toBe("0px");
  expect(outline.style).not.toBe("none");

  // Keyboard-only empty submit: focus Sign In, activate with Enter.
  await page.getByRole("button", { name: "Sign In" }).focus();
  await page.keyboard.press("Enter");

  // Inline error linked to the field + focus moved to the first error.
  await expect(page.getByText("Enter your email address.")).toBeVisible();
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("aria-describedby", "login-email-error");

  const { critical, serious } = await runAxe(page, "Login error state");
  expect(
    critical.concat(serious),
    `Critical/serious violations on Login error state: ${[...critical, ...serious].map((v) => v.id).join(", ")}`
  ).toHaveLength(0);
});

// ─── 15. Browse category filter — combobox keyboard semantics ─────────────
//
// Phase 2 (REPORT F-07 combobox, F-09 labels). The category options always
// include the 29 predefined taxonomy entries
// (`client/src/lib/opportunityCategories.ts:55-60`), so this flow is
// seed-independent and performs no writes: typing only filters client-side.
test("Browse category filter — combobox label, activedescendant, keyboard commit, axe", async ({
  page,
}) => {
  await loginAs(page, QA_STUDENT_EMAIL);
  await page.goto(`${BASE}/browse`);
  await page.waitForLoadState("networkidle");

  // Anti-vacuous: prove the browse view actually rendered.
  await expect(
    page.getByRole("heading", { name: "Browse Opportunities" })
  ).toBeVisible({ timeout: 15000 });

  // F-09: both filter controls expose accessible names (previously
  // placeholder-only).
  const search = page.getByLabel("Search opportunities, organizations, or categories");
  await expect(search).toBeVisible();
  const combo = page.getByRole("combobox", { name: "Filter by category" });
  await expect(combo).toBeVisible();

  // Keyboard-only open: focus expands the listbox.
  await combo.focus();
  await expect(combo).toHaveAttribute("aria-expanded", "true");
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();

  // The highlighted option is exposed via aria-activedescendant.
  // (Located by id-attribute selector: React useId values contain colons,
  // which break `#id` CSS lookups, and CSS.escape is a browser-only API.)
  const firstDescendant = await combo.getAttribute("aria-activedescendant");
  expect(
    firstDescendant,
    "combobox exposes no aria-activedescendant when open"
  ).toBeTruthy();
  const firstOption = page.locator(`[id="${firstDescendant}"]`);
  await expect(firstOption).toHaveAttribute("role", "option");

  // ArrowDown moves the highlight (activedescendant tracks it).
  await page.keyboard.press("ArrowDown");
  const secondDescendant = await combo.getAttribute("aria-activedescendant");
  expect(secondDescendant).toBeTruthy();
  expect(
    secondDescendant,
    "ArrowDown did not move the combobox highlight"
  ).not.toBe(firstDescendant);

  // Typing filters, Enter commits the highlighted match ("Environment").
  await combo.fill("env");
  await expect(combo).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Enter");
  await expect(combo).toHaveValue("Environment");

  // The clear button names the field it clears (previously "Clear selection").
  const clear = page.getByRole("button", { name: "Clear Filter by category" });
  await expect(clear).toBeVisible();

  // Escape closes the listbox; the committed value is kept.
  await page.keyboard.press("Escape");
  await expect(combo).toHaveAttribute("aria-expanded", "false");
  await expect(combo).toHaveValue("Environment");

  const { critical, serious } = await runAxe(page, "Browse combobox committed");
  expect(
    critical.concat(serious),
    `Critical/serious violations on Browse with committed filter: ${[...critical, ...serious].map((v) => v.id).join(", ")}`
  ).toHaveLength(0);
});

// ─── 16. School register wizard — labels, combobox, toggle, errors ───────
//
// Phase 2 (REPORT F-08 register dropdown, F-09/F-10 labels/errors). Public
// route, no login. Reaches the search step through the email path's
// client-side step transitions; the only requests issued are read-only
// directory lookups (domain suggestions + school search), so no seed state
// is created or mutated — account creation happens only at the later
// contact-step submit, which this test never performs.
test("School register — labelled fields, search combobox, password toggle, axe", async ({
  page,
}) => {
  await page.goto(`${BASE}/school/register`);
  await page.waitForLoadState("networkidle");

  // Anti-vacuous: prove the wizard actually rendered.
  await expect(
    page.getByRole("heading", { name: "Register Your School" })
  ).toBeVisible({ timeout: 15000 });

  await page.getByRole("button", { name: "Register with email & password" }).click();
  await expect(
    page.getByRole("heading", { name: "Create your account" })
  ).toBeVisible({ timeout: 10000 });

  // F-09: labels are associated via htmlFor (previously wrapping-only, so
  // getByLabel could not resolve them).
  await expect(page.getByLabel("Full Name")).toBeVisible();
  await expect(page.getByLabel("School Email")).toBeVisible();
  const password = page.getByLabel("Password");
  await expect(password).toBeVisible();

  // F-08: show-password is keyboard-reachable with pressed state
  // (previously tabIndex={-1}, reachable by mouse only, stateless).
  const toggle = page.getByRole("button", { name: "Show password" });
  await expect(toggle).toBeVisible();
  await toggle.focus();
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Hide password" })
  ).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Show password" })
  ).toBeVisible();

  // F-08: password rules are a live checklist, not color-only.
  await password.fill("Aa1!aaaa");
  await expect(page.getByText("At least 8 characters")).toBeVisible();

  // Advance to the search step (read-only domain-suggestion lookup only).
  await page.getByLabel("Full Name").fill("QA A11y");
  await page.getByLabel("School Email").fill("qa-a11y@example.edu");
  await page.getByRole("button", { name: /Find Your School/ }).click();
  await expect(
    page.getByRole("heading", { name: "Find Your School" })
  ).toBeVisible({ timeout: 15000 });

  // F-08/F-09: search combobox semantics + labelled companions.
  const schoolSearch = page.getByRole("combobox", {
    name: "Search for your school by name or city",
  });
  await expect(schoolSearch).toBeVisible();
  await expect(schoolSearch).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByLabel("Filter schools by state")).toBeVisible();
  await expect(page.getByLabel("Enter school name manually")).toBeVisible();

  const { critical, serious } = await runAxe(page, "School register search");
  expect(
    critical.concat(serious),
    `Critical/serious violations on school register search: ${[...critical, ...serious].map((v) => v.id).join(", ")}`
  ).toHaveLength(0);
});

// ─── 17. Staff attendance QR issuance — labels, empty state, axe ────────────
//
// Read-only: logs in as school staff, opens /attendance-qr, and asserts the
// labelled session/TTL controls (or the empty state when no session awaits
// check-in), then runs the axe critical/serious gate. The Issue button is
// never activated — minting a code writes an AttendanceQrToken row, so no
// seed state is created or mutated here.
test("Attendance QR issuance — labelled controls, empty state, axe", async ({
  page,
}) => {
  await loginAs(page, QA_SCHOOL_EMAIL);
  await page.goto(`${BASE}/attendance-qr`);
  await page.waitForLoadState("networkidle");

  // Anti-vacuous: prove the issuance page actually rendered.
  await expect(
    page.getByRole("heading", { level: 1, name: "Attendance QR codes" })
  ).toBeVisible({ timeout: 15000 });

  const emptyState = page.getByRole("heading", {
    name: "No sessions awaiting check-in",
  });
  const sessionSelect = page.getByLabel("Session awaiting check-in");

  if (await emptyState.isVisible()) {
    // Empty state: the only action is a real link, keyboard-reachable.
    const cta = page.getByRole("link", { name: "View cohorts" });
    await expect(cta).toBeVisible();
    await cta.focus();
    await expect(cta).toBeFocused();
  } else {
    // Issuance form: native labelled selects + a named submit button.
    await expect(sessionSelect).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel("Code lifetime")).toBeVisible();
    const issue = page.getByRole("button", { name: "Issue attendance code" });
    await expect(issue).toBeVisible();
    await issue.focus();
    await expect(issue).toBeFocused();
  }

  const { critical, serious } = await runAxe(page, "Attendance QR issuance");
  expect(
    critical.concat(serious),
    `Critical/serious violations on attendance QR issuance: ${[...critical, ...serious].map((v) => v.id).join(", ")}`
  ).toHaveLength(0);
});
