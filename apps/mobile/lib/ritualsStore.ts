import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"

export type Mark = "empty" | "yes" | "no" | "skip"

export type Ritual = {
  id: string
  name: string
  intention?: string
  tags: string[]
  reminder?: string // "HH:MM"
  notificationId?: string // expo-notifications id
  history: Record<string, Mark>
  createdAt?: string
  updatedAt?: string
}

export function localISODate(date?: Date): string {
  const d = date ?? new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return localISODate(new Date())
}

export function canEditDate(isoDate: string): boolean {
  return isoDate <= todayISO()
}

const MARK_CYCLE: Mark[] = ["empty", "yes", "no", "skip"]

function nextMark(current: Mark): Mark {
  const idx = MARK_CYCLE.indexOf(current)
  return MARK_CYCLE[(idx + 1) % MARK_CYCLE.length]
}

type RitualsState = {
  rituals: Ritual[]
  upsert: (r: Ritual) => void
  remove: (id: string) => void
  setMark: (id: string, isoDate: string, mark: Mark) => void
}

export const useRitualsStore = create<RitualsState>()(
  persist(
    (set) => ({
      rituals: [],

      upsert: (r) =>
        set((s) => {
          const exists = s.rituals.find((x) => x.id === r.id)
          return exists
            ? { rituals: s.rituals.map((x) => (x.id === r.id ? r : x)) }
            : { rituals: [...s.rituals, r] }
        }),

      remove: (id) =>
        set((s) => ({ rituals: s.rituals.filter((x) => x.id !== id) })),

      setMark: (id, isoDate, mark) =>
        set((s) => {
          if (!canEditDate(isoDate)) return s

          const ritual = s.rituals.find((x) => x.id === id)
          if (!ritual) return s

          const nextHistory = { ...(ritual.history || {}) }

          if (mark === "empty") {
            delete nextHistory[isoDate]
          } else {
            nextHistory[isoDate] = mark
          }

          const updated: Ritual = {
            ...ritual,
            history: nextHistory,
            updatedAt: new Date().toISOString(),
          }

          return {
            rituals: s.rituals.map((x) => (x.id === id ? updated : x)),
          }
        }),
    }),
    {
      name: "heartspirit.rituals.v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ rituals: s.rituals }),
    }
  )
)

export { nextMark }