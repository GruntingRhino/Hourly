export type SyncMappingScope = {
  externalId: string;
  externalParentId?: string | null;
};

export function selectedSectionIdsForCleanup(
  sectionMappings: readonly SyncMappingScope[],
  selectedExternalCourseIds: readonly string[],
  plannedSectionIds: readonly string[],
): Set<string> {
  const selectedCourseIds = new Set(selectedExternalCourseIds);
  return new Set([
    ...plannedSectionIds,
    ...sectionMappings
      .filter((mapping) => mapping.externalParentId && selectedCourseIds.has(mapping.externalParentId))
      .map((mapping) => mapping.externalId),
  ]);
}

export function isMappingInSelectedSyncScope(params: {
  mapping: SyncMappingScope;
  selectedExternalCourseIds: readonly string[];
  selectedSectionIds: ReadonlySet<string>;
  mappingParent: "course" | "section";
}): boolean {
  if (params.mappingParent === "course") {
    const selectedCourseIds = new Set(params.selectedExternalCourseIds);
    return (
      selectedCourseIds.has(params.mapping.externalId) ||
      (params.mapping.externalParentId ? selectedCourseIds.has(params.mapping.externalParentId) : false)
    );
  }

  return Boolean(
    params.mapping.externalParentId && params.selectedSectionIds.has(params.mapping.externalParentId),
  );
}
