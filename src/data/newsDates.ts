export function isRecentNews(value:string | undefined, now = Date.now()) {
  const age = now - Date.parse(value ?? '');
  return Number.isFinite(age) && age >= 0 && age <= 24 * 3600_000;
}
