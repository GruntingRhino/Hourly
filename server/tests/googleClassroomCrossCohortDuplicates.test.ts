import assert from "node:assert/strict";
import test from "node:test";
import { createClassroomStudentEmailRegistry } from "../src/services/googleClassroomSyncNormalization";

const student = (id: string, email: string) => ({ id, email });

test("the same Google Classroom user may appear in two cohorts", () => {
  const registry = createClassroomStudentEmailRegistry();

  assert.equal(registry.record(student("user-1", "shared@example.test"), "cohort-a"), null);
  assert.equal(registry.record(student("user-1", "SHARED@example.test"), "cohort-b"), null);
});

test("interleaved cohorts still reject different users with the same email in the same cohort", () => {
  const registry = createClassroomStudentEmailRegistry();

  assert.equal(registry.record(student("user-1", "shared@example.test"), "cohort-a"), null);
  assert.equal(registry.record(student("user-2", "shared@example.test"), "cohort-b"), null);
  assert.equal(registry.record(student("user-3", "shared@example.test"), "cohort-a"), "user-1");
});

test("a second external user with the same email in one cohort fails closed", () => {
  const registry = createClassroomStudentEmailRegistry();

  assert.equal(registry.record(student("user-1", "shared@example.test"), "cohort-a"), null);
  assert.equal(registry.record(student("user-2", "shared@example.test"), "cohort-a"), "user-1");
});
