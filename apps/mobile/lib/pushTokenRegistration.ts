import * as Notifications from "expo-notifications"
import Constants from "expo-constants"
import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getSupabaseClient } from "./supabaseClient"

const CIRCLES_PREFS_KEY = "heartspirit.push.circles_prefs"
/** Matches expo-notifications `defaultChannel` in app.json — used for remote FCM push. */
export const DEFAULT_PUSH_CHANNEL_ID = "default"

const REGISTER_ATTEMPT_COOLDOWN_MS = 15_000
const REGISTER_SUCCESS_SKIP_MS = 5 * 60_000

export type CircleReminderPrefs = { weekBefore: boolean; dayBefore: boolean }

export type RegisterPushTokenOptions = {
  /** Dev log label for why registration ran. */
  reason?: string
  /** Bypass cooldown / recent-success skip (e.g. Settings notifications open). */
  force?: boolean
}

/** In-app circle reminder opt-in defaults (OS permission is separate). */
export const DEFAULT_CIRCLE_REMINDER_PREFS: CircleReminderPrefs = {
  weekBefore: true,
  dayBefore: true,
}

let lastRegisterAttemptAt = 0
let lastRegisterSuccess: { userId: string; token: string; at: number } | null = null

function resolveCircleReminderPrefs(
  weekBefore: boolean | null | undefined,
  dayBefore: boolean | null | undefined
): CircleReminderPrefs {
  return {
    weekBefore: weekBefore ?? true,
    dayBefore: dayBefore ?? true,
  }
}

function logPushDev(message: string, details?: Record<string, unknown>): void {
  if (typeof __DEV__ === "undefined" || !__DEV__) return
  if (details) {
    console.log(`[Push] ${message}`, details)
  } else {
    console.log(`[Push] ${message}`)
  }
}

function tokenPrefix(token: string): string {
  return token.length > 28 ? `${token.slice(0, 28)}…` : token
}

function resolveEasProjectId(): string | undefined {
  const fromExtra = Constants.expoConfig?.extra?.eas?.projectId
  const fromEasConfig = Constants.easConfig?.projectId
  return (typeof fromExtra === "string" && fromExtra) || (typeof fromEasConfig === "string" && fromEasConfig) || undefined
}

function shouldSkipRegisterAttempt(
  userId: string,
  token: string,
  options?: RegisterPushTokenOptions
): boolean {
  if (options?.force) return false

  const now = Date.now()
  if (now - lastRegisterAttemptAt < REGISTER_ATTEMPT_COOLDOWN_MS) {
    logPushDev("register skipped (cooldown)", { reason: options?.reason })
    return true
  }

  if (
    lastRegisterSuccess &&
    lastRegisterSuccess.userId === userId &&
    lastRegisterSuccess.token === token &&
    now - lastRegisterSuccess.at < REGISTER_SUCCESS_SKIP_MS
  ) {
    logPushDev("register skipped (recent success, same token)", { reason: options?.reason })
    return true
  }

  return false
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
  logPushDev("permission status", { status, platform: Platform.OS })
  if (status !== "granted") return null

  await ensureDefaultPushChannel()

  const projectId = resolveEasProjectId()
  logPushDev("resolved EAS projectId", {
    projectId: projectId ?? "(missing)",
    platform: Platform.OS,
  })

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    })
    const token = data ?? null
    if (token) {
      logPushDev("Expo push token fetched", {
        platform: Platform.OS,
        tokenPrefix: tokenPrefix(token),
      })
    } else {
      logPushDev("Expo push token empty", { platform: Platform.OS })
    }
    return token
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.warn("[Push] getExpoPushTokenAsync failed:", message)
    logPushDev("getExpoPushTokenAsync error", { message, platform: Platform.OS, projectId })
    return null
  }
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

function pushPlatform(): "ios" | "android" | "web" {
  if (Platform.OS === "ios") return "ios"
  if (Platform.OS === "android") return "android"
  return "web"
}

async function removeStalePlatformTokens(
  userId: string,
  platform: "ios" | "android",
  currentToken: string
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase
    .from("user_push_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("platform", platform)
    .neq("expo_push_token", currentToken)

  if (error) {
    logPushDev("stale token cleanup failed", { message: error.message, platform })
  }
}

async function upsertPushTokenForUser(
  userId: string,
  token: string,
  options?: RegisterPushTokenOptions
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    logPushDev("upsert skipped (no supabase client)", { reason: options?.reason })
    return false
  }

  if (shouldSkipRegisterAttempt(userId, token, options)) {
    return false
  }

  lastRegisterAttemptAt = Date.now()

  const platform = pushPlatform()
  const deviceId = getDeviceId(token)

  logPushDev("upserting push token", {
    reason: options?.reason,
    userId,
    platform,
    tokenPrefix: tokenPrefix(token),
    deviceIdPrefix: tokenPrefix(deviceId),
  })

  const { error } = await supabase.from("user_push_tokens").upsert(
    {
      user_id: userId,
      expo_push_token: token,
      platform,
      device_id: deviceId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,device_id" }
  )

  if (error) {
    console.warn("[Push] Failed to register token:", error.message)
    logPushDev("Supabase upsert error", {
      message: error.message,
      userId,
      platform,
      reason: options?.reason,
    })
    return false
  }

  if (platform === "ios" || platform === "android") {
    await removeStalePlatformTokens(userId, platform, token)
  }

  lastRegisterSuccess = { userId, token, at: Date.now() }
  logPushDev("Supabase upsert success", {
    userId,
    platform,
    tokenPrefix: tokenPrefix(token),
    reason: options?.reason,
  })
  return true
}

/** Upsert push token when OS permission is already granted (no native prompt). */
export async function registerPushTokenIfGranted(
  options?: RegisterPushTokenOptions
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    logPushDev("register aborted (no supabase)", { reason: options?.reason })
    return false
  }

  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError) {
    logPushDev("register aborted (auth error)", {
      reason: options?.reason,
      message: authError.message,
    })
    return false
  }
  if (!auth?.user) {
    logPushDev("register aborted (no user)", { reason: options?.reason })
    return false
  }

  const token = await fetchExpoPushTokenWhenGranted()
  if (!token) {
    logPushDev("register aborted (no token)", {
      reason: options?.reason,
      userId: auth.user.id,
      platform: Platform.OS,
    })
    return false
  }

  return upsertPushTokenForUser(auth.user.id, token, options)
}

/** Request OS permission (if needed), then register push token with Supabase. */
export async function requestNotificationPermissionAndRegister(
  options?: RegisterPushTokenOptions
): Promise<boolean> {
  const token = await getExpoPushToken()
  if (!token) return false

  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return false

  return upsertPushTokenForUser(auth.user.id, token, {
    ...options,
    force: true,
    reason: options?.reason ?? "permission-request",
  })
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
