export type CanvasStudentCandidate = {
  id: string;
  email: string;
};

export function normalizeCanvasEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function partitionStudentsWithinSection<T extends CanvasStudentCandidate>(students: T[]): {
  unique: T[];
  duplicates: Array<{ student: T; existingExternalId: string }>;
} {
  const firstByEmail = new Map<string, T>();
  const unique: T[] = [];
  const duplicates: Array<{ student: T; existingExternalId: string }> = [];

  for (const student of students) {
    const email = normalizeCanvasEmail(student.email);
    const existing = firstByEmail.get(email);
    if (existing) {
      duplicates.push({ student, existingExternalId: existing.id });
      continue;
    }
    firstByEmail.set(email, student);
    unique.push(student);
  }

  return { unique, duplicates };
}
