import AsyncStorage from "@react-native-async-storage/async-storage"

type CacheEnvelope<T> = {
  cachedAt: number
  data: T
}

export const OfflineCacheKeys = {
  energy: {
    todayPlacements: "offline.energy.todayPlacements.v1",
    seasonalPlacements: (season: string) => `offline.energy.seasonalPlacements.${season}.v1`,
    supportModes: (feelingSlug: string) => `offline.energy.supportModes.${feelingSlug}.v1`,
    recommendation: (feelingSlug: string, supportModeSlug: string) =>
      `offline.energy.recommendation.${feelingSlug}.${supportModeSlug}.v1`,
    profileDisplayName: (userId: string) => `offline.energy.profileDisplayName.${userId}.v1`,
  },
  practice: {
    detail: (id: string) => `offline.practice.detail.${id}.v1`,
  },
  circles: {
    list: "offline.circles.list.v1",
    next: "offline.circles.next.v1",
  },
  home: {
    weeklyReflection: "offline.home.weeklyReflection.v1",
  },
} as const

export async function setOfflineCache<T>(key: string, data: T): Promise<void> {
  const envelope: CacheEnvelope<T> = {
    cachedAt: Date.now(),
    data,
  }
  await AsyncStorage.setItem(key, JSON.stringify(envelope))
}

export async function getOfflineCache<T>(key: string): Promise<CacheEnvelope<T> | null> {
  const raw = await AsyncStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CacheEnvelope<T>
  } catch {
    return null
  }
}

export async function getOfflineCacheData<T>(key: string): Promise<T | null> {
  const envelope = await getOfflineCache<T>(key)
  return envelope?.data ?? null
}
