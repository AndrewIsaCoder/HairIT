const WEEKDAY_SHORT = new Intl.DateTimeFormat('ro-RO', { weekday: 'short' });
const WEEKDAY_LONG = new Intl.DateTimeFormat('ro-RO', { weekday: 'long' });
const MONTH_SHORT = new Intl.DateTimeFormat('ro-RO', { month: 'short' });
const LONG = new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });
const SHORT = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long' });

function parse(date: string): Date {
  return new Date(date.length > 10 ? date.replace(' ', 'T') : `${date}T12:00:00`);
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** „Sâm.” — ziua săptămânii, prescurtată. */
export function weekdayShort(date: string): string {
  return capitalize(WEEKDAY_SHORT.format(parse(date)));
}

/** „sâmbătă” — ziua săptămânii, întreagă. */
export function weekdayLong(date: string): string {
  return WEEKDAY_LONG.format(parse(date));
}

/** „29” — ziua din lună. */
export function dayNumber(date: string): string {
  return String(parse(date).getDate());
}

/** „aug.” — luna, prescurtată. */
export function monthShort(date: string): string {
  return MONTH_SHORT.format(parse(date));
}

/** „sâmbătă, 29 august” — data completă. */
export function longDate(date: string): string {
  return LONG.format(parse(date));
}

/** „29 august” — data scurtă. */
export function shortDate(date: string): string {
  return SHORT.format(parse(date));
}

/** „150 lei” — prețul afișat în interfață. */
export function money(value: number): string {
  return value.toLocaleString('ro-RO') + ' lei';
}

/** „1 h 30 min” — durata unui serviciu. */
export function duration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** „acum 3 ore”, „ieri”, „12 martie” — vechimea unei notificări sau recenzii. */
export function relativeTime(value: string): string {
  const date = parse(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);

  if (minutes < 1) return 'chiar acum';
  if (minutes < 60) return `acum ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `acum ${hours} h`;

  const days = Math.round(hours / 24);
  if (days === 1) return 'ieri';
  if (days < 7) return `acum ${days} zile`;

  return SHORT.format(date);
}

/** Numărul de zile până la o dată, folosit pentru „peste 3 zile”. */
export function daysUntil(date: string): number {
  const target = parse(date);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** „astăzi”, „mâine”, „peste 4 zile”. */
export function whenLabel(date: string): string {
  const days = daysUntil(date);
  if (days === 0) return 'astăzi';
  if (days === 1) return 'mâine';
  if (days > 1 && days < 7) return `peste ${days} zile`;
  return shortDate(date);
}
