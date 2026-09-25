import assert from "node:assert/strict";
import test from "node:test";
import {
  isMappingInSelectedSyncScope,
  selectedSectionIdsForCleanup,
} from "../src/services/lmsSyncScope";

const mappings = [
  { externalId: "section-a", externalParentId: "course-a" },
  { externalId: "section-b", externalParentId: "course-b" },
  { externalId: "enrollment-a1", externalParentId: "section-a" },
  { externalId: "enrollment-b1", externalParentId: "section-b" },
];

test("partial selection preserves unselected section and enrollment mappings", () => {
  const selectedSectionIds = selectedSectionIdsForCleanup(
    mappings,
    ["course-a"],
    ["section-a"],
  );

  assert.equal(
    isMappingInSelectedSyncScope({
      mapping: mappings[1],
      selectedExternalCourseIds: ["course-a"],
      selectedSectionIds,
      mappingParent: "section",
    }),
    false,
  );
  assert.equal(
    isMappingInSelectedSyncScope({
      mapping: mappings[3],
      selectedExternalCourseIds: ["course-a"],
      selectedSectionIds,
      mappingParent: "section",
    }),
    false,
  );
});

test("an omitted existing section under a selected course remains in cleanup scope", () => {
  const selectedSectionIds = selectedSectionIdsForCleanup(mappings, ["course-a"], []);
  assert.equal(selectedSectionIds.has("section-a"), true);
  assert.equal(selectedSectionIds.has("section-b"), false);
  assert.equal(
    isMappingInSelectedSyncScope({
      mapping: mappings[0],
      selectedExternalCourseIds: ["course-a"],
      selectedSectionIds,
      mappingParent: "course",
    }),
    true,
  );
  assert.equal(
    isMappingInSelectedSyncScope({
      mapping: mappings[1],
      selectedExternalCourseIds: ["course-a"],
      selectedSectionIds,
      mappingParent: "course",
    }),
    false,
  );
  assert.equal(
    isMappingInSelectedSyncScope({
      mapping: mappings[3],
      selectedExternalCourseIds: ["course-a"],
      selectedSectionIds,
      mappingParent: "section",
    }),
    false,
  );
});

test("Google Classroom course mappings are scoped by selected course id", () => {
  assert.equal(
    isMappingInSelectedSyncScope({
      mapping: { externalId: "course-a", externalParentId: "course-a" },
      selectedExternalCourseIds: ["course-a"],
      selectedSectionIds: new Set(["course-a"]),
      mappingParent: "course",
    }),
    true,
  );
  assert.equal(
    isMappingInSelectedSyncScope({
      mapping: { externalId: "course-b", externalParentId: "course-b" },
      selectedExternalCourseIds: ["course-a"],
      selectedSectionIds: new Set(["course-a"]),
      mappingParent: "course",
    }),
    false,
  );
});
