/** Today's date in local timezone as `YYYY-MM-DD` (for `<input type="date" max="…">`). */
export function todayIsoDateLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** True if `yyyy-mm-dd` is strictly after today (local). */
export function isDateOfBirthInFuture(isoDate: string): boolean {
  if (!isoDate) return false;
  return isoDate > todayIsoDateLocal();
}
