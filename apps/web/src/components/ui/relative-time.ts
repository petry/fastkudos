const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(value: string | Date, now: Date = new Date()): string {
  const then = typeof value === 'string' ? new Date(value) : value;
  const diff = now.getTime() - then.getTime();

  if (diff < MINUTE) return 'agora';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h`;
  if (diff < 2 * DAY) return 'ontem';

  const dd = String(then.getDate()).padStart(2, '0');
  const mm = String(then.getMonth() + 1).padStart(2, '0');
  const hh = String(then.getHours()).padStart(2, '0');
  const mi = String(then.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${mi}`;
}
