/** Shared India (IST) calendar helpers — same timezone as quotes & greeting */

export const IST_TIMEZONE = 'Asia/Kolkata'

export function istCalendarDateKey(d = new Date()) {
  return d.toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE })
}

export function istDateKeyFromIso(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE })
}

/** Whole calendar days from startKey to endKey (YYYY-MM-DD, inclusive math). */
export function istCalendarDaysBetween(startKey: string, endKey: string) {
  const [ay, am, ad] = startKey.split('-').map(Number)
  const [by, bm, bd] = endKey.split('-').map(Number)
  const a = new Date(ay, am - 1, ad)
  const b = new Date(by, bm - 1, bd)
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000))
}
