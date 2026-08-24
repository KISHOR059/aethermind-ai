/**
 * Utility functions for formatting and comparing task dates & times cleanly
 * across client timezones without UTC date-shift artifacts.
 */

export function parseTaskDate(value?: string): { date: Date; isDateOnly: boolean } | null {
  if (!value) return null;

  // Date-only format "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return { date: new Date(y, m - 1, d), isDateOnly: true };
  }

  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return null;

  // Detect UTC midnight (date-only value serialized as UTC ISO timestamp)
  const isUtcMidnight =
    value.endsWith("T00:00:00.000Z") ||
    value.endsWith("T00:00:00Z") ||
    value.endsWith("T00:00:00");

  if (isUtcMidnight) {
    const utcDate = new Date(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
    );
    return { date: utcDate, isDateOnly: true };
  }

  return { date: parsed, isDateOnly: false };
}

export function formatTaskDueDate(
  dueDate?: string,
  estimatedMinutes?: number,
): string {
  if (!dueDate) return "No due date set";

  const result = parseTaskDate(dueDate);
  if (!result) return "Invalid date";

  const { date, isDateOnly } = result;

  // If date-only and no explicit duration, display only the full date
  if (isDateOnly && !estimatedMinutes) {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(
      date,
    );
  }

  // If specific time or has estimated minutes
  const formatted = new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: isDateOnly ? undefined : "short",
  }).format(date);

  if (estimatedMinutes) {
    return `${formatted} (${estimatedMinutes} min)`;
  }

  return formatted;
}

export function formatShortTaskDueDate(dueDate?: string): string | null {
  if (!dueDate) return null;

  const result = parseTaskDate(dueDate);
  if (!result) return null;

  const { date, isDateOnly } = result;
  const now = new Date();
  const isCurrentYear = date.getFullYear() === now.getFullYear();

  const isToday = date.toDateString() === now.toDateString();
  const dateStr = isToday
    ? "Today"
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: isCurrentYear ? undefined : "numeric",
      }).format(date);

  if (isDateOnly) {
    return dateStr;
  }

  const timeStr = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${dateStr} · ${timeStr}`;
}

export function formatTaskTimestamp(timestamp?: string): string {
  if (!timestamp) return "N/A";

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function isTaskSameDay(
  isoDate: string | undefined,
  compareDate: Date,
): boolean {
  if (!isoDate) return false;

  const result = parseTaskDate(isoDate);
  if (!result) return false;

  const { date } = result;
  return (
    date.getFullYear() === compareDate.getFullYear() &&
    date.getMonth() === compareDate.getMonth() &&
    date.getDate() === compareDate.getDate()
  );
}

export function combineDateAndTime(
  dateStr?: string,
  timeStr?: string,
): string | undefined {
  if (!dateStr || !dateStr.trim()) return undefined;

  const trimmedDate = dateStr.trim();
  const trimmedTime = timeStr?.trim();

  // If no time is specified, return date-only string or ISO UTC midnight
  if (!trimmedTime) {
    return trimmedDate;
  }

  // Parse YYYY-MM-DD and HH:MM
  const [year, month, day] = trimmedDate.split("-").map(Number);
  const [hours, minutes] = trimmedTime.split(":").map(Number);

  if (
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day) ||
    isNaN(hours) ||
    isNaN(minutes)
  ) {
    return trimmedDate;
  }

  const combined = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return combined.toISOString();
}

export function splitDateAndTime(isoString?: string): {
  date: string;
  time: string;
} {
  if (!isoString) return { date: "", time: "" };

  // If already "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    return { date: isoString, time: "" };
  }

  const parsed = new Date(isoString);
  if (isNaN(parsed.getTime())) return { date: "", time: "" };

  const isUtcMidnight =
    isoString.endsWith("T00:00:00.000Z") ||
    isoString.endsWith("T00:00:00Z") ||
    isoString.endsWith("T00:00:00");

  if (isUtcMidnight) {
    const y = parsed.getUTCFullYear();
    const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const d = String(parsed.getUTCDate()).padStart(2, "0");
    return { date: `${y}-${m}-${d}`, time: "" };
  }

  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  const hh = String(parsed.getHours()).padStart(2, "0");
  const mm = String(parsed.getMinutes()).padStart(2, "0");

  return { date: `${y}-${m}-${d}`, time: `${hh}:${mm}` };
}
