/**
 * Minimal client-side CSV escaping, mirroring server/src/lib/csv.ts.
 *
 * Client-built exports (school queues, activity log, org volunteer summary)
 * re-expose fetched names/titles that school staff open in spreadsheets, so
 * every cell is quoted (embedded quotes doubled) and cells beginning with a
 * formula trigger character (= + - @ |, tab, CR) are prefixed with a single
 * quote so spreadsheet apps render them as text instead of executing them.
 */

export function escapeCsvCell(value: string | number | null | undefined): string {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@|\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildCsvRows(rows: Array<Array<string | number | null | undefined>>): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}
