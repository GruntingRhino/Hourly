export type GoogleClassroomStudentCandidate = {
  id: string;
  email: string;
};

export function normalizeClassroomEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createClassroomStudentEmailRegistry() {
  const ownersByEmail = new Map<string, Map<string, string>>();

  return {
    record(student: GoogleClassroomStudentCandidate, cohortId: string): string | null {
      const email = normalizeClassroomEmail(student.email);
      let ownersByCohort = ownersByEmail.get(email);
      if (!ownersByCohort) {
        ownersByCohort = new Map<string, string>();
        ownersByEmail.set(email, ownersByCohort);
      }

      const existingExternalId = ownersByCohort.get(cohortId);
      if (existingExternalId && existingExternalId !== student.id) return existingExternalId;
      if (!existingExternalId) ownersByCohort.set(cohortId, student.id);
      return null;
    },
  };
}
