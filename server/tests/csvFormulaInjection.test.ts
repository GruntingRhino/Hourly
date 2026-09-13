import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { csvCell, buildCsv } from "../src/lib/csv";
import { escapeCsvCell, buildCsvRows } from "../../client/src/lib/csv";

// F-08: exported student CSVs are opened in spreadsheets, so every cell that
// begins with a formula trigger character must be neutralized. These are pure
// functions (no database), all fixtures synthetic.

const INJECTION_VECTORS = [
  '=HYPERLINK("https://evil.test","Click")',
  "=1+1",
  "+1+1",
  "-1+1",
  "@SUM(1:10)",
  "|calc|cmd",
  "\t=1+1",
  "\r=1+1",
  "=cmd|'/c calc'!A0",
];

for (const vector of INJECTION_VECTORS) {
  test(`server csvCell neutralizes leading formula trigger: ${JSON.stringify(vector.slice(0, 12))}`, () => {
    const cell = csvCell(vector);
    assert.ok(cell.startsWith(`"'`), `expected single-quote prefix, got ${cell}`);
    // The raw payload must not survive as a live leading trigger inside quotes.
    assert.doesNotMatch(cell, /^"=/);
    assert.doesNotMatch(cell, /^"\+/);
    assert.doesNotMatch(cell, /^"-/);
    assert.doesNotMatch(cell, /^"@/);
    assert.doesNotMatch(cell, /^"\|/);
  });
}

test("server csvCell leaves benign values and numeric hours untouched", () => {
  assert.equal(csvCell("Alice Rivera"), '"Alice Rivera"');
  assert.equal(csvCell("Volunteer 12"), '"Volunteer 12"');
  assert.equal(csvCell(4), '"4"');
  assert.equal(csvCell(4.5), '"4.5"');
  assert.equal(csvCell(null), '""');
  assert.equal(csvCell(undefined), '""');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  // A trigger character mid-cell is not a formula: no prefix added.
  assert.equal(csvCell("Room 2+2"), '"Room 2+2"');
});

test("server buildCsv serializes rows with CRLF-safe quoting", () => {
  const csv = buildCsv([
    ["Name", "Email", "Hours"],
    ["=Evil", "a@example.test", 4],
  ]);
  assert.equal(csv, '"Name","Email","Hours"\n"\'=Evil","a@example.test","4"');
});

test("client escapeCsvCell matches the server contract on every vector", () => {
  const benign = ["Alice Rivera", "Volunteer 12", "Room 2+2", 'say "hi"', "", 4, 4.5, null, undefined];
  for (const value of [...INJECTION_VECTORS, ...benign]) {
    assert.equal(
      escapeCsvCell(value as string),
      csvCell(value as string),
      `client/server mismatch for ${JSON.stringify(value)}`,
    );
  }
  const rows: Array<Array<string | number | null | undefined>> = [
    ["Name", "Hours"],
    ["=Evil", 4],
  ];
  assert.equal(buildCsvRows(rows), buildCsv(rows));
});

test("every client-built PII export routes cells through escapeCsvCell", () => {
  const clientRoot = path.resolve(__dirname, "..", "..", "client", "src");
  for (const file of [
    "pages/school/Groups.tsx",
    "pages/school/Settings.tsx",
    "pages/organization/Settings.tsx",
  ]) {
    const source = fs.readFileSync(path.join(clientRoot, file), "utf8");
    assert.match(source, /escapeCsvCell/, `${file} must escape CSV cells (formula-injection guard)`);
    assert.doesNotMatch(
      source,
      /replace\(\/"\/g, '""'\)/,
      `${file} must not use the old unescaped quote-only CSV builder`,
    );
  }
});
