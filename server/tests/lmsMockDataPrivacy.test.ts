import assert from "node:assert/strict";
import test from "node:test";
import { getCanvasMockDataset } from "../src/services/canvasMock";
import { getGoogleClassroomMockDataset } from "../src/services/googleClassroomMock";

const scenarios = ["default", "renamed", "archived", "deleted", "student_removed", "same_section_duplicate"] as const;

test("Canvas mock rosters contain only reserved synthetic email domains", () => {
  for (const scenario of scenarios) {
    for (const user of getCanvasMockDataset(scenario).users) {
      assert.match(user.email, /@example\.invalid$/);
    }
  }
});

test("Google Classroom mock rosters contain only reserved synthetic email domains", () => {
  for (const scenario of scenarios) {
    for (const user of getGoogleClassroomMockDataset(scenario).users) {
      assert.match(user.email, /@example\.invalid$/);
    }
  }
});

test("same-section duplicate mock scenarios contain two distinct duplicate identities", () => {
  const canvas = getCanvasMockDataset("same_section_duplicate");
  assert.equal(
    canvas.enrollments.filter(
      (enrollment) => enrollment.sectionId === "canvas-section-bio-p1" && enrollment.userId.startsWith("canvas-student-dup-"),
    ).length,
    2,
  );

  const google = getGoogleClassroomMockDataset("same_section_duplicate");
  assert.equal(
    google.enrollments.filter(
      (enrollment) => enrollment.courseId === "gclass-course-bio" && enrollment.userId.startsWith("gclass-student-dup-"),
    ).length,
    2,
  );
});
