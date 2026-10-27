const formatters = new Map();

/** Formats integer minor units (paise) as currency: ₹129 for whole amounts, ₹26.90 otherwise. */
export function money(minor, currency = 'INR') {
  const value = minor || 0;
  const digits = value % 100 === 0 ? 0 : 2;
  const key = `${currency}|${digits}`;
  if (!formatters.has(key)) {
    formatters.set(
      key,
      new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : undefined, {
        style: 'currency',
        currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    );
  }
  return formatters.get(key).format(value / 100);
}

export function percentFromBps(bps) {
  return `${(bps / 100).toFixed(bps % 100 ? 1 : 0)}%`;
}

export function dateTime(value) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function timeAgo(value) {
  const s = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return dateTime(value);
}

export const STATUS_LABELS = {
  pending: 'Received',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
