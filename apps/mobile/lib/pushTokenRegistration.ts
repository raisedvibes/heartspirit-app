import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getSupabaseClient } from "./supabaseClient"

const CIRCLES_PREFS_KEY = "heartspirit.push.circles_prefs"

export type CircleReminderPrefs = { weekBefore: boolean; dayBefore: boolean }

/** Load circle reminder prefs from profiles (if authenticated) or local fallback. */
export async function loadCircleReminderPrefs(): Promise<CircleReminderPrefs> {
  const supabase = getSupabaseClient()
  if (!supabase) return getLocalPrefs()

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return getLocalPrefs()

  const { data, error } = await supabase
    .from("profiles")
    .select("notif_circles_week_before, notif_circles_day_before")
    .eq("id", auth.user.id)
    .maybeSingle()

  if (!error && data) {
    const p: CircleReminderPrefs = {
      weekBefore: data.notif_circles_week_before ?? false,
      dayBefore: data.notif_circles_day_before ?? false,
    }
    saveLocalPrefs(p)
    return p
  }
  return getLocalPrefs()
}

async function getLocalPrefs(): Promise<CircleReminderPrefs> {
  try {
    const raw = await AsyncStorage.getItem(CIRCLES_PREFS_KEY)
    if (raw) {
      const p = JSON.parse(raw) as CircleReminderPrefs
      return { weekBefore: p.weekBefore ?? false, dayBefore: p.dayBefore ?? false }
    }
  } catch {}
  return { weekBefore: false, dayBefore: false }
}

async function saveLocalPrefs(prefs: CircleReminderPrefs) {
  try {
    await AsyncStorage.setItem(CIRCLES_PREFS_KEY, JSON.stringify(prefs))
  } catch {}
}

/** Request permissions and return Expo push token, or null if denied. */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let final = existing
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync()
    final = status
  }
  if (final !== "granted") return null

  let projectId: string | undefined
  try {
    const Constants = await import("expo-constants")
    projectId = Constants.default?.expoConfig?.extra?.eas?.projectId
  } catch {
    projectId = undefined
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: projectId ?? undefined,
  })
  return token ?? null
}

/** Stable device id for upsert key. Uses push token when no native id available. */
function getDeviceId(token: string): string {
  return token
}

/** Register push token with Supabase. Call after login. Requires authenticated user. */
export async function registerPushToken(): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return false

  const token = await getExpoPushToken()
  if (!token) return false

  const platform = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web"
  const deviceId = getDeviceId(token)

  const { error } = await supabase.from("user_push_tokens").upsert(
    {
      user_id: auth.user.id,
      expo_push_token: token,
      platform,
      device_id: deviceId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,device_id" }
  )

  if (error) {
    console.warn("[Push] Failed to register token:", error.message)
    return false
  }
  return true
}

/** Update circle reminder preferences in profiles. Saves locally as fallback. */
export async function updateCircleReminderPrefs(weekBefore: boolean, dayBefore: boolean): Promise<boolean> {
  saveLocalPrefs({ weekBefore, dayBefore })

  const supabase = getSupabaseClient()
  if (!supabase) return true

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return true

  const { error } = await supabase
    .from("profiles")
    .update({
      notif_circles_week_before: weekBefore,
      notif_circles_day_before: dayBefore,
    })
    .eq("id", auth.user.id)

  if (error) {
    console.warn("[Push] Failed to update circle prefs:", error.message)
    return false
  }
  return true
}
