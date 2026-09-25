import assert from "node:assert/strict";
import test from "node:test";
import { getCanvasMockDataset } from "../src/services/canvasMock";
import { getGoogleClassroomMockDataset } from "../src/services/googleClassroomMock";

test("Canvas mock rosters contain only reserved synthetic email domains", () => {
  for (const scenario of ["default", "renamed", "archived", "deleted", "student_removed"] as const) {
    for (const user of getCanvasMockDataset(scenario).users) {
      assert.match(user.email, /@example\.invalid$/);
    }
  }
});

test("Google Classroom mock rosters contain only reserved synthetic email domains", () => {
  for (const scenario of ["default", "renamed", "archived", "deleted", "student_removed"] as const) {
    for (const user of getGoogleClassroomMockDataset(scenario).users) {
      assert.match(user.email, /@example\.invalid$/);
    }
  }
});
