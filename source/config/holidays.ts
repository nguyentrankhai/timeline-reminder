const holidays2026: string[] = [
  "2026-01-01",
  "2026-02-16",
  "2026-02-17",
  "2026-02-18",
  "2026-04-30",
  "2026-05-01",
  "2026-09-02",
  "2026-09-06",
]

export function getHolidays(): Date[] {
  return holidays2026.map((d) => new Date(d + "T00:00:00"))
}

export function isHoliday(date: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return getHolidays().some(
    (h) => h.getTime() === d.getTime()
  )
}
