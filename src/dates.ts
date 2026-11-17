// Fixed date rules shared by sections and sources (spec 0007 AC-5, spec 0009 AC-9): one English month table, and
// day arithmetic in UTC on `YYYY-MM-DD` strings. Never the locale or the clock.

/** Short English month names, `Jan` to `Dec`. */
export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const satisfies readonly string[];

const MS_PER_DAY = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A `YYYY-MM-DD` string that names a real calendar day (spec 0009, "A real date"). */
export function isRealDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10) === value;
}

/** Days since 1970-01-01 (UTC) for a real `YYYY-MM-DD` date. */
export function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
}

/** The `YYYY-MM-DD` date of a day number from `dayNumber`. */
export function dateOfDay(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

/** The UTC weekday of a day number, Sunday 0. */
export function weekdayOfDay(day: number): number {
  return new Date(day * MS_PER_DAY).getUTCDay();
}

/** `2026-10-31` (or `2026-10`) to `Oct 2026`. */
export function formatMonthYear(date: string): string {
  const [year, month] = date.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/** `2026-11-07` to `Nov 7, 2026`: the UTC day without zero padding. */
export function formatDay(date: string): string {
  const [year, month, day] = date.split("-");
  return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}`;
}
