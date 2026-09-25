import assert from "node:assert/strict";
import test from "node:test";
import { partitionStudentsWithinSection } from "../src/services/canvasSyncNormalization";

const student = (id: string, email: string) => ({
  enrollmentId: `enrollment-${id}`,
  id,
  name: `Student ${id}`,
  email,
});

test("Canvas allows the same user to belong to multiple selected sections", () => {
  const shared = student("canvas-user-1", "shared@example.test");
  const first = partitionStudentsWithinSection([shared]);
  const second = partitionStudentsWithinSection([shared]);

  assert.deepEqual(first.duplicates, []);
  assert.deepEqual(second.duplicates, []);
  assert.equal(first.unique.length, 1);
  assert.equal(second.unique.length, 1);
});

test("Canvas rejects two different user IDs with the same email inside one section", () => {
  const result = partitionStudentsWithinSection([
    student("canvas-user-1", "shared@example.test"),
    student("canvas-user-2", "SHARED@example.test"),
  ]);

  assert.equal(result.unique.length, 1);
  assert.equal(result.duplicates.length, 1);
  assert.equal(result.duplicates[0].student.id, "canvas-user-2");
  assert.equal(result.duplicates[0].existingExternalId, "canvas-user-1");
});
