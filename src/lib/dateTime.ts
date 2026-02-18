export type DateFormat = "dd/mm/yyyy" | "mm/dd/yyyy" | "yyyy-mm-dd";
export type TimeFormat = "24h" | "12h";

const DATE_FORMAT_KEY = "vortex:settings:date-format";
const TIME_FORMAT_KEY = "vortex:settings:time-format";

const DEFAULT_DATE_FORMAT: DateFormat = "dd/mm/yyyy";
const DEFAULT_TIME_FORMAT: TimeFormat = "24h";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function normalizeDateInput(value: string): string {
  const trimmed = value.trim();
  // Backend sometimes returns ISO-like UTC timestamps without timezone suffix.
  // Treat them as UTC to avoid local-time drift (e.g. -2h / +2h display errors).
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(trimmed)) {
    return `${trimmed.replace(" ", "T")}Z`;
  }
  return value;
}

function parseDate(value: string | number | Date): Date | null {
  const source =
    typeof value === "string" ? normalizeDateInput(value) : value;
  const parsed = value instanceof Date ? value : new Date(source);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getStoredDateFormat(): DateFormat {
  try {
    const raw = localStorage.getItem(DATE_FORMAT_KEY);
    if (raw === "dd/mm/yyyy" || raw === "mm/dd/yyyy" || raw === "yyyy-mm-dd") {
      return raw;
    }
  } catch {
    // ignore localStorage errors
  }
  return DEFAULT_DATE_FORMAT;
}

export function setStoredDateFormat(format: DateFormat) {
  localStorage.setItem(DATE_FORMAT_KEY, format);
}

export function getStoredTimeFormat(): TimeFormat {
  try {
    const raw = localStorage.getItem(TIME_FORMAT_KEY);
    if (raw === "24h" || raw === "12h") return raw;
  } catch {
    // ignore localStorage errors
  }
  return DEFAULT_TIME_FORMAT;
}

export function setStoredTimeFormat(format: TimeFormat) {
  localStorage.setItem(TIME_FORMAT_KEY, format);
}

export function formatDate(value: string | number | Date): string {
  const date = parseDate(value);
  if (!date) return String(value);

  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const format = getStoredDateFormat();
  if (format === "yyyy-mm-dd") return `${y}-${m}-${d}`;
  if (format === "mm/dd/yyyy") return `${m}/${d}/${y}`;
  return `${d}/${m}/${y}`;
}

export function formatTime(value: string | number | Date): string {
  const date = parseDate(value);
  if (!date) return String(value);
  const timeFormat = getStoredTimeFormat();
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: timeFormat === "12h",
  });
}

export function formatDateTime(value: string | number | Date): string {
  const date = parseDate(value);
  if (!date) return String(value);
  return `${formatDate(date)} ${formatTime(date)}`;
}
