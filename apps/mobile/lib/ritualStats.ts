import { localISODate } from "./ritualsStore"
import type { Mark } from "./ritualsStore"

function prevDayISO(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() - 1)
  return localISODate(date)
}

/**
 * Counts consecutive "yes" days ending at the anchor.
 * - "no" breaks streak, returns 0 if today is "no"
 * - "skip" breaks streak immediately
 * - unmarked day breaks streak
 * - if today is "yes" → start from today
 * - if today is "skip" or unmarked → start from yesterday
 * - if today is "no" → return 0
 */
export function computeStreak(
  history: Record<string, Mark>,
  todayISO: string
): number {
  const todayVal = history?.[todayISO] as Mark | undefined

  if (todayVal === "no") return 0
  if (todayVal === "skip") return 0

  const anchor =
    todayVal === "yes" ? todayISO : prevDayISO(todayISO)

  let streak = 0
  let current = anchor

  while (true) {
    const v = history?.[current] as Mark | undefined
    if (v === "yes") {
      streak++
      current = prevDayISO(current)
    } else {
      break
    }
  }

  return streak
}
