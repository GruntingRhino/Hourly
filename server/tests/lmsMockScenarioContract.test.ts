import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { getCanvasMockDataset } from "../src/services/canvasMock";
import { getGoogleClassroomMockDataset } from "../src/services/googleClassroomMock";

const scenarios = [
  "default",
  "renamed",
  "archived",
  "deleted",
  "student_removed",
  "same_section_duplicate",
] as const;

test("Canvas and Google Classroom expose every mock scenario", () => {
  for (const scenario of scenarios) {
    assert.equal(getCanvasMockDataset(scenario).scenario, scenario);
    assert.equal(getGoogleClassroomMockDataset(scenario).scenario, scenario);
  }
});

test("Settings preserves and exposes every server-supported mock scenario", () => {
  const settingsPath = path.resolve(
    process.cwd(),
    "../client/src/pages/school/Settings.tsx",
  );
  const source = fs.readFileSync(settingsPath, "utf8");

  for (const scenario of scenarios) {
    const optionCount = source.match(
      new RegExp(`value="${scenario}"`, "g"),
    )?.length ?? 0;
    assert.equal(optionCount, 2, `${scenario} must be selectable for Canvas and Google Classroom`);
  }

  assert.match(source, /useState<"default"[^;]*"same_section_duplicate">/);
  assert.match(source, /scenario as "default"[^;]*"same_section_duplicate"/);
});
