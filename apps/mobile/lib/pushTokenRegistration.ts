import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getSupabaseClient } from "./supabaseClient"

const CIRCLES_PREFS_KEY = "heartspirit.push.circles_prefs"
/** Matches expo-notifications `defaultChannel` in app.json — used for remote FCM push. */
export const DEFAULT_PUSH_CHANNEL_ID = "default"

export type CircleReminderPrefs = { weekBefore: boolean; dayBefore: boolean }

/** In-app circle reminder opt-in defaults (OS permission is separate). */
export const DEFAULT_CIRCLE_REMINDER_PREFS: CircleReminderPrefs = {
  weekBefore: true,
  dayBefore: true,
}

function resolveCircleReminderPrefs(
  weekBefore: boolean | null | undefined,
  dayBefore: boolean | null | undefined
): CircleReminderPrefs {
  return {
    weekBefore: weekBefore ?? true,
    dayBefore: dayBefore ?? true,
  }
}

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
    const p = resolveCircleReminderPrefs(
      data.notif_circles_week_before,
      data.notif_circles_day_before
    )
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
      return resolveCircleReminderPrefs(p.weekBefore, p.dayBefore)
    }
  } catch {}
  return { ...DEFAULT_CIRCLE_REMINDER_PREFS }
}

async function saveLocalPrefs(prefs: CircleReminderPrefs) {
  try {
    await AsyncStorage.setItem(CIRCLES_PREFS_KEY, JSON.stringify(prefs))
  } catch {}
}

async function ensureDefaultPushChannel(): Promise<void> {
  if (Platform.OS !== "android") return

  await Notifications.setNotificationChannelAsync(DEFAULT_PUSH_CHANNEL_ID, {
    name: "General",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  })
}

async function fetchExpoPushTokenWhenGranted(): Promise<string | null> {
  if (Platform.OS === "web") return null

  const { status } = await Notifications.getPermissionsAsync()
  if (status !== "granted") return null

  await ensureDefaultPushChannel()

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

/** Request OS permission, then return Expo push token, or null if denied. */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null

  const { status: existing, canAskAgain } = await Notifications.getPermissionsAsync()
  if (existing === "granted") {
    return fetchExpoPushTokenWhenGranted()
  }
  if (!canAskAgain) {
    console.warn("[Push] Notification permission denied; cannot request again")
    return null
  }

  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== "granted") {
    console.warn("[Push] Notification permission not granted")
    return null
  }

  return fetchExpoPushTokenWhenGranted()
}

/** Stable device id for upsert key. Uses push token when no native id available. */
function getDeviceId(token: string): string {
  return token
}

/** Upsert push token when OS permission is already granted (no native prompt). */
export async function registerPushTokenIfGranted(): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return false

  const token = await fetchExpoPushTokenWhenGranted()
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

/** Request OS permission (if needed), then register push token with Supabase. */
export async function requestNotificationPermissionAndRegister(): Promise<boolean> {
  const token = await getExpoPushToken()
  if (!token) return false

  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return false

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

/** @deprecated Prefer registerPushTokenIfGranted or requestNotificationPermissionAndRegister. */
export async function registerPushToken(): Promise<boolean> {
  return requestNotificationPermissionAndRegister()
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
