import { slotDateTime } from "./icsGenerator";

/** Legacy Opportunity dates are UTC-midnight calendar dates; wall-clock times are Eastern. */
type LegacyOpportunityTime = { date: Date; startTime: string; endTime: string };
const ZONE = "America/New_York";
const LEAD_MS = 30 * 60 * 1000;
const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function validTime(value: string): boolean {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(value.trim());
  if (!match) return false;
  const hour = Number(match[1]);
  return Number(match[2]) < 60 && (match[3] ? hour >= 1 && hour <= 12 : hour <= 23);
}

function unambiguousInstant(date: Date, time: string): Date | null {
  if (!validTime(time)) return null;
  const reference = slotDateTime(date, time, ZONE);
  if (!Number.isFinite(reference.getTime())) return null;
  const expectedDate = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(time.trim())!;
  let hour = Number(match[1]);
  const ampm = match[3]?.toUpperCase();
  if (ampm === "AM" && hour === 12) hour = 0;
  if (ampm === "PM" && hour < 12) hour += 12;
  // The shared converter's first offset can be wrong on the transition day.
  // Check neighboring UTC hours and accept exactly one matching Eastern wall time:
  // spring gaps have none and fall-back's repeated hour has two.
  const matches = [-2, -1, 0, 1, 2].map((shift) => new Date(reference.getTime() + shift * 60 * 60 * 1000)).filter((candidate) => {
    const parts = Object.fromEntries(formatter.formatToParts(candidate).map(({ type, value }) => [type, value]));
    return `${parts.year}-${parts.month}-${parts.day}` === expectedDate
      && Number(parts.hour) === hour && Number(parts.minute) === Number(match[2]);
  });
  return matches.length === 1 ? matches[0] : null;
}

export function isLegacyOpportunityQrWindowOpen(event: LegacyOpportunityTime, now = new Date()): boolean {
  if (!(event.date instanceof Date) || !Number.isFinite(event.date.getTime()) || !Number.isFinite(now.getTime())) return false;
  const start = unambiguousInstant(event.date, event.startTime);
  const end = unambiguousInstant(event.date, event.endTime);
  if (!start || !end || end.getTime() <= start.getTime()) return false;
  return now.getTime() >= start.getTime() - LEAD_MS && now.getTime() <= end.getTime();
}
