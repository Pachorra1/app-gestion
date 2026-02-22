const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIMEZONE_OFFSET_REGEX = /[zZ]|[+-]\d{2}:\d{2}$/;
const DEFAULT_LOCALE = "es-AR";

const getClientTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

function parseLocalDate(value?: string | null | Date): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (DATE_ONLY_REGEX.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  if (value.includes("T") && !TIMEZONE_OFFSET_REGEX.test(value)) {
    value = `${value}Z`;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatWithOptions(date: Date, options: Intl.DateTimeFormatOptions) {
  const timeZone = getClientTimeZone();
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, { timeZone, ...options }).format(date);
}

export function formatFecha(value?: string | null | Date, options?: Intl.DateTimeFormatOptions) {
  const date = parseLocalDate(value);
  if (!date) return "";

  return formatWithOptions(date, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(options ?? {}),
  });
}

export function formatFechaHora(value?: string | null | Date, options?: Intl.DateTimeFormatOptions) {
  const date = parseLocalDate(value);
  if (!date) return "";

  return formatWithOptions(date, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...(options ?? {}),
  });
}

export function parseFecha(value?: string | null | Date): Date | null {
  if (!value) return null;
  return parseLocalDate(value);
}

const padZero = (value: number) => value.toString().padStart(2, "0");

export function formatDateForInput(value?: string | null | Date): string {
  const date = parseLocalDate(value ?? new Date());
  if (!date) return "";

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  const year = local.getFullYear();
  const month = padZero(local.getMonth() + 1);
  const day = padZero(local.getDate());
  return `${year}-${month}-${day}`;
}
