// /lib/rituals.ts
"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type Mark = "empty" | "yes" | "no" | "skip"

export interface Ritual {
  id: string
  name: string
  tags: string[]
  reminder?: string
  history: Record<string, Mark>
  createdAt: string
  updatedAt: string
}

export const WEEK_LABELS_MON_START = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** Local YYYY-MM-DD (no UTC drift) */
export function localISODate(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Parse YYYY-MM-DD into a LOCAL midnight Date (avoid UTC parsing) */
export function parseLocalISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map((n) => Number.parseInt(n, 10))
  return new Date(y, (m || 1) - 1, d || 1)
}

// ---- new helpers to block future edits ----
export function todayISO(): string {
  return localISODate(new Date())
}
export function canEditDate(isoDate: string): boolean {
  // allow past + today, block future
  return isoDate <= todayISO() // safe lexicographic compare for YYYY-MM-DD
}

export function getMonStartWeek(date: Date = new Date()): string[] {
  const d = new Date(date)
  const dayOfWeek = d.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  d.setDate(d.getDate() + mondayOffset)

  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    days.push(localISODate(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

/** Treat legacy shapes as YES too (e.g., true/1/"YES") */
export function isYes(v: unknown): boolean {
  if (v === "yes") return true
  if (v === true) return true
  if (v === 1) return true
  if (typeof v === "string") return v.trim().toLowerCase() === "yes"
  return false
}

/** Total YES up to & including a given day (default: today). Ideal for your "Record" 🔥 badge. */
export function computeRecordTotal(history: Record<string, Mark>, upToISO: string = localISODate()): number {
  let total = 0
  for (const [k, v] of Object.entries(history)) {
    if (k <= upToISO && isYes(v)) total++
  }
  return total
}

/**
 * Consecutive YES ending today (streak).
 * Fixes prior off-by-one by parsing ISO in LOCAL time.
 */
export function computeStreak(history: Record<string, Mark>, todayISOParam: string = localISODate()): number {
  let count = 0
  const d = parseLocalISODate(todayISOParam) // ✅ local, not UTC

  // Walk backwards until we hit "no"/"empty"/undefined
  for (let i = 0; i < 3650; i++) {
    const iso = localISODate(d)
    const mark = history[iso]
    if (mark === "no" || mark === undefined || mark === "empty") break
    if (mark === "yes") count += 1
    // "skip" does not add to count and also stops the streak
    if (mark === "skip") break
    d.setDate(d.getDate() - 1)
  }
  return count
}

interface RitualsStore {
  rituals: Ritual[]
  setMark: (id: string, isoDate: string, mark: Mark) => void
  upsert: (ritual: Ritual) => void
  remove: (id: string) => void
}

export const useRitualsStore = create<RitualsStore>()(
  persist(
    (set) => ({
      rituals: [],

      // ✅ Immutable update so subscribers re-render
      setMark: (id, isoDate, mark) =>
        set(({ rituals }) => {
          // block future-day edits; allow past + today
          if (!canEditDate(isoDate)) return { rituals }

          const next = rituals.map((r) => {
            if (r.id !== id) return r
            const history = { ...r.history }
            if (mark === "empty") delete history[isoDate]
            else history[isoDate] = mark
            return { ...r, history, updatedAt: new Date().toISOString() }
          })
          return { rituals: next }
        }),

      upsert: (ritual) =>
        set(({ rituals }) => {
          const i = rituals.findIndex((r) => r.id === ritual.id)
          const next = [...rituals]
          if (i === -1) next.unshift(ritual)
          else next[i] = { ...next[i], ...ritual, updatedAt: new Date().toISOString() }
          return { rituals: next }
        }),

      remove: (id) => set(({ rituals }) => ({ rituals: rituals.filter((r) => r.id !== id) })),
    }),
    {
      name: "heartspirit.rituals.v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ rituals: s.rituals }),
    },
  ),
)
