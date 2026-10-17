export function formatNumber(value: number, locale = 'en-US') {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatCurrency(value: number, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function formatDate(value: string | Date, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}

const AREA_UNIT_PATTERN = /(?:\bsq\.?\s*km\b|\bkm(?:\s*\^?2|²|\b)|\bsquare\s+kilomet(?:er|re)s?\b|\bacres?\b|\bhectares?\b|\bha\b|\bsq\.?\s*mi\b|\bmi(?:\s*\^?2|²|\b))/i;
const NUMERIC_AREA_PATTERN = /^\s*(?:(?:about|around|approximately|approx\.?|circa)\s*)?[~≈]?\s*[\d,]+(?:\.\d+)?(?:\s*(?:-|–|to)\s*[\d,]+(?:\.\d+)?)?(?:\s*\([^)]*\))?\s*$/i;

export function formatAreaValue(value: unknown) {
  if (Array.isArray(value)) {
    const items = value.filter((item) => item !== null && item !== undefined && String(item).trim() !== '');
    return items.length ? items.map(formatAreaValue).join(', ') : '—';
  }
  if (value === null || value === undefined || value === '') return '—';

  const text = String(value).trim();
  if (!text) return '—';
  if (AREA_UNIT_PATTERN.test(text) || !NUMERIC_AREA_PATTERN.test(text)) return text;
  return `${text} sq km`;
}

export function parseAreaInput(value: string, originalValue: unknown): string | number {
  const originalText = String(originalValue ?? '').trim();
  const parsed = AREA_UNIT_PATTERN.test(originalText) ? value.trim() : value.trim().replace(/\s+sq\s+km$/i, '');
  if (typeof originalValue === 'number') return parsed ? Number(parsed.replace(/,/g, '')) || 0 : 0;
  return parsed;
}
