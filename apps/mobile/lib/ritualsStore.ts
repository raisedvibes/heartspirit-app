import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { StateStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { cancelScheduledNotification } from "./ritualNotifications"

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
  hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
  upsert: (r: Ritual) => void
  remove: (id: string) => void
  setMark: (id: string, isoDate: string, mark: Mark) => void
}

/** Internal persist name (middleware); AsyncStorage keys are user-scoped — see `scopedStorageKey`. */
const PERSIST_MIDDLEWARE_NAME = "heartspirit.rituals.v1"

/** Pre–user-scoped installs used this key for the full persisted JSON blob. */
const LEGACY_ASYNC_STORAGE_KEY = "heartspirit.rituals.v1"

const ANONYMOUS_KEY = "heartspirit:rituals:__anonymous__"

function scopedStorageKey(userId: string | null): string {
  if (userId) return `heartspirit:rituals:${userId}`
  return ANONYMOUS_KEY
}

/**
 * Current Supabase user id for persistence, or `null` when logged out.
 * `undefined` = before first `syncRitualsStoreWithAuthUserId` (treat like anonymous for reads).
 */
let ritualsPersistUserId: string | null | undefined = undefined

function createUserScopedStorage(): StateStorage {
  return {
    getItem: async (name) => {
      if (name !== PERSIST_MIDDLEWARE_NAME) {
        return AsyncStorage.getItem(name)
      }
      const uid = ritualsPersistUserId
      const key = scopedStorageKey(uid ?? null)
      let value = await AsyncStorage.getItem(key)
      if (value) return value
      if (uid) {
        const legacy = await AsyncStorage.getItem(LEGACY_ASYNC_STORAGE_KEY)
        if (legacy) {
          await AsyncStorage.setItem(key, legacy)
          await AsyncStorage.removeItem(LEGACY_ASYNC_STORAGE_KEY)
          return legacy
        }
      }
      return null
    },
    setItem: async (name, value) => {
      if (name !== PERSIST_MIDDLEWARE_NAME) {
        await AsyncStorage.setItem(name, value)
        return
      }
      const key = scopedStorageKey(ritualsPersistUserId ?? null)
      await AsyncStorage.setItem(key, value)
    },
    removeItem: async (name) => {
      if (name !== PERSIST_MIDDLEWARE_NAME) {
        await AsyncStorage.removeItem(name)
        return
      }
      const key = scopedStorageKey(ritualsPersistUserId ?? null)
      await AsyncStorage.removeItem(key)
    },
  }
}

export const useRitualsStore = create<RitualsState>()(
  persist(
    (set) => ({
      rituals: [],
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

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
      name: PERSIST_MIDDLEWARE_NAME,
      storage: createJSONStorage(() => createUserScopedStorage()),
      partialize: (s) => ({ rituals: s.rituals }),
      onRehydrateStorage: () => (state, _error) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

/**
 * Call whenever the Supabase auth user changes (initial session, login, logout, account switch).
 * Persists under `heartspirit:rituals:${userId}`; logged-out uses `heartspirit:rituals:__anonymous__`.
 * Cancels scheduled ritual reminders for the previous account before clearing memory.
 */
export async function syncRitualsStoreWithAuthUserId(userId: string | null): Promise<void> {
  if (ritualsPersistUserId === userId && ritualsPersistUserId !== undefined) {
    return
  }

  const switchingAccount = ritualsPersistUserId !== undefined && ritualsPersistUserId !== userId
  if (switchingAccount) {
    const rituals = useRitualsStore.getState().rituals
    for (const r of rituals) {
      await cancelScheduledNotification(r.notificationId)
    }
  }

  ritualsPersistUserId = userId

  useRitualsStore.setState({ rituals: [], hasHydrated: false })
  await useRitualsStore.persist.rehydrate()
}

export { nextMark }
