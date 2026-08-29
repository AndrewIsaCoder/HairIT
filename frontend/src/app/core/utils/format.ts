const WEEKDAY = new Intl.DateTimeFormat('ro-RO', { weekday: 'short' });
const MONTH = new Intl.DateTimeFormat('ro-RO', { month: 'short' });
const LONG = new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });

function parse(date: string): Date {
  return new Date(date + 'T12:00:00');
}

/** „Sâm.” — ziua saptamanii, prescurtata. */
export function weekdayShort(date: string): string {
  const value = WEEKDAY.format(parse(date));
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** „29” — ziua din luna. */
export function dayNumber(date: string): string {
  return String(parse(date).getDate());
}

/** „aug.” — luna, prescurtata. */
export function monthShort(date: string): string {
  return MONTH.format(parse(date));
}

/** „sâmbătă, 29 august” — data completa. */
export function longDate(date: string): string {
  return LONG.format(parse(date));
}

/** „150 lei” — pretul afisat in interfata. */
export function money(value: number): string {
  return value.toLocaleString('ro-RO') + ' lei';
}
