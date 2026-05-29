import * as Notifications from "expo-notifications"
import Constants from "expo-constants"
import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getSupabaseClient } from "./supabaseClient"

const CIRCLES_PREFS_KEY = "heartspirit.push.circles_prefs"
const PUSH_SYNC_STATUS_KEY = "heartspirit.push.sync_status"

/** True in dev or when EXPO_PUBLIC_INTERNAL_QA=true (internal / Play testing builds). */
export function showPushTokenDiagnostics(): boolean {
  if (typeof __DEV__ !== "undefined" && __DEV__) return true
  const flag = process.env.EXPO_PUBLIC_INTERNAL_QA?.trim().toLowerCase()
  return flag === "true" || flag === "1"
}
/** Matches app.json extra.eas.projectId — required when Constants omit it in store builds. */
const EAS_PROJECT_ID_FALLBACK = "79e04053-4a59-476b-a26a-b58994bf9a45"
/** Matches expo-notifications `defaultChannel` in app.json — used for remote FCM push. */
export const DEFAULT_PUSH_CHANNEL_ID = "default"

const REGISTER_ATTEMPT_COOLDOWN_MS = 15_000
const REGISTER_SUCCESS_SKIP_MS = 5 * 60_000

export type CircleReminderPrefs = { weekBefore: boolean; dayBefore: boolean }

export type RegisterPushTokenOptions = {
  reason?: string
  force?: boolean
}

export type PushTokenSyncStage =
  | "no-supabase"
  | "no-user"
  | "permission-denied"
  | "missing-project-id"
  | "no-expo-token"
  | "upsert-failed"
  | "verify-failed"
  | "skipped"
  | "success"

export type PushTokenSyncResult = {
  ok: boolean
  stage: PushTokenSyncStage
  at: string
  reason?: string
  errorMessage?: string
  permissionStatus?: string
  projectId?: string
  tokenPrefix?: string
  userId?: string
}

export type PushTokenSyncSnapshot = PushTokenSyncResult & {
  dbRegistered: boolean
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

export function tokenPrefix(token: string): string {
  return token.length > 28 ? `${token.slice(0, 28)}…` : token
}

function logPush(message: string, details?: Record<string, unknown>): void {
  if (details) {
    console.log(`[Push] ${message}`, details)
  } else {
    console.log(`[Push] ${message}`)
  }
}

export function resolveEasProjectId(): string {
  const candidates = [
    Constants.expoConfig?.extra?.eas?.projectId,
    Constants.easConfig?.projectId,
    (Constants.manifest2 as { extra?: { expoClient?: { eas?: { projectId?: string } } } } | null)
      ?.extra?.expoClient?.eas?.projectId,
    (Constants.manifest as { extra?: { eas?: { projectId?: string } } } | null)?.extra?.eas
      ?.projectId,
    EAS_PROJECT_ID_FALLBACK,
  ]
  for (const id of candidates) {
    if (typeof id === "string" && id.length > 0) return id
  }
  return EAS_PROJECT_ID_FALLBACK
}

async function persistPushSyncStatus(result: PushTokenSyncResult): Promise<void> {
  try {
    await AsyncStorage.setItem(PUSH_SYNC_STATUS_KEY, JSON.stringify(result))
  } catch {}
}

export async function loadPushTokenSyncSnapshot(): Promise<PushTokenSyncSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(PUSH_SYNC_STATUS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PushTokenSyncResult
    let dbRegistered = false
    if (parsed.ok && parsed.userId) {
      dbRegistered = await verifyPushTokenInDatabase(parsed.userId)
    }
    return { ...parsed, dbRegistered }
  } catch {
    return null
  }
}

/** True if this user has a readable push token row for the current platform. */
export async function verifyPushTokenInDatabase(
  userId: string,
  expectedToken?: string
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const platform = pushPlatform()
  if (platform === "web") return false

  const { data, error } = await supabase
    .from("user_push_tokens")
    .select("expo_push_token, updated_at")
    .eq("user_id", userId)
    .eq("platform", platform)
    .order("updated_at", { ascending: false })
    .limit(5)

  if (error || !data?.length) return false

  if (expectedToken) {
    return data.some((row) => row.expo_push_token === expectedToken)
  }
  return true
}

function shouldSkipRegisterAttempt(
  userId: string,
  token: string,
  options?: RegisterPushTokenOptions
): boolean {
  if (options?.force) return false

  const now = Date.now()
  if (now - lastRegisterAttemptAt < REGISTER_ATTEMPT_COOLDOWN_MS) {
    return true
  }

  if (
    lastRegisterSuccess &&
    lastRegisterSuccess.userId === userId &&
    lastRegisterSuccess.token === token &&
    now - lastRegisterSuccess.at < REGISTER_SUCCESS_SKIP_MS
  ) {
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

async function resolveAuthenticatedUserId(): Promise<{ userId: string } | { error: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { error: "Supabase client not configured (missing env)" }
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    return { error: sessionError.message }
  }
  if (sessionData.session?.user?.id) {
    return { userId: sessionData.session.user.id }
  }

  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError) {
    return { error: authError.message }
  }
  if (!auth?.user?.id) {
    return { error: "Not signed in" }
  }
  return { userId: auth.user.id }
}

async function fetchExpoPushTokenWhenGranted(): Promise<{
  token: string | null
  permissionStatus: string
  projectId: string
  errorMessage?: string
}> {
  const projectId = resolveEasProjectId()

  if (Platform.OS === "web") {
    return { token: null, permissionStatus: "unsupported", projectId, errorMessage: "Web unsupported" }
  }

  const { status } = await Notifications.getPermissionsAsync()
  if (status !== "granted") {
    return { token: null, permissionStatus: status, projectId, errorMessage: "OS permission not granted" }
  }

  await ensureDefaultPushChannel()

  if (!projectId) {
    return {
      token: null,
      permissionStatus: status,
      projectId: "",
      errorMessage: "Missing EAS projectId",
    }
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId })
    const token = data ?? null
    if (!token) {
      return {
        token: null,
        permissionStatus: status,
        projectId,
        errorMessage: "Expo returned empty push token",
      }
    }
    return { token, permissionStatus: status, projectId }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.warn("[Push] getExpoPushTokenAsync failed:", message)
    return { token: null, permissionStatus: status, projectId, errorMessage: message }
  }
}

/** Request OS permission, then return Expo push token, or null if denied. */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null

  const { status: existing, canAskAgain } = await Notifications.getPermissionsAsync()
  if (existing === "granted") {
    const { token } = await fetchExpoPushTokenWhenGranted()
    return token
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

  const { token } = await fetchExpoPushTokenWhenGranted()
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
): Promise<string | undefined> {
  const supabase = getSupabaseClient()
  if (!supabase) return undefined

  const { error } = await supabase
    .from("user_push_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("platform", platform)
    .neq("expo_push_token", currentToken)

  if (error) {
    return error.message
  }
  return undefined
}

function buildResult(
  partial: Omit<PushTokenSyncResult, "at"> & { at?: string }
): PushTokenSyncResult {
  return { at: partial.at ?? new Date().toISOString(), ...partial }
}

async function upsertPushTokenForUser(
  userId: string,
  token: string,
  options?: RegisterPushTokenOptions
): Promise<PushTokenSyncResult> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return buildResult({
      ok: false,
      stage: "no-supabase",
      reason: options?.reason,
      errorMessage: "Supabase client not configured",
    })
  }

  if (shouldSkipRegisterAttempt(userId, token, options)) {
    const prior = await loadPushTokenSyncSnapshot()
    if (prior?.ok) {
      return buildResult({
        ok: true,
        stage: "skipped",
        reason: options?.reason,
        tokenPrefix: prior.tokenPrefix,
        userId,
        projectId: prior.projectId,
        permissionStatus: prior.permissionStatus,
      })
    }
    return buildResult({
      ok: false,
      stage: "skipped",
      reason: options?.reason,
      errorMessage: "Skipped (cooldown); try again or open Settings to force sync",
      userId,
    })
  }

  lastRegisterAttemptAt = Date.now()

  const platform = pushPlatform()
  const deviceId = token

  logPush("upserting push token", {
    reason: options?.reason,
    userId,
    platform,
    tokenPrefix: tokenPrefix(token),
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
    return buildResult({
      ok: false,
      stage: "upsert-failed",
      reason: options?.reason,
      errorMessage: error.message,
      userId,
      tokenPrefix: tokenPrefix(token),
    })
  }

  if (platform === "ios" || platform === "android") {
    const cleanupError = await removeStalePlatformTokens(userId, platform, token)
    if (cleanupError) {
      logPush("stale token cleanup failed", { message: cleanupError, platform })
    }
  }

  const prefix = tokenPrefix(token)
  const verified = await verifyPushTokenInDatabase(userId, token)
  if (!verified) {
    return buildResult({
      ok: false,
      stage: "verify-failed",
      reason: options?.reason,
      errorMessage:
        "Upsert returned OK but row not readable (check Supabase RLS on user_push_tokens)",
      userId,
      tokenPrefix: prefix,
    })
  }

  lastRegisterSuccess = { userId, token, at: Date.now() }
  logPush("Supabase upsert verified", { userId, platform, tokenPrefix: prefix })

  return buildResult({
    ok: true,
    stage: "success",
    reason: options?.reason,
    userId,
    tokenPrefix: prefix,
  })
}

/** Full push registration with persisted status for Settings diagnostics. */
export async function syncPushToken(
  options?: RegisterPushTokenOptions
): Promise<PushTokenSyncResult> {
  const projectId = resolveEasProjectId()
  const reason = options?.reason

  const supabase = getSupabaseClient()
  if (!supabase) {
    const result = buildResult({
      ok: false,
      stage: "no-supabase",
      reason,
      errorMessage: "Supabase client not configured (EXPO_PUBLIC_SUPABASE_* env)",
      projectId,
    })
    await persistPushSyncStatus(result)
    return result
  }

  const auth = await resolveAuthenticatedUserId()
  if ("error" in auth) {
    const result = buildResult({
      ok: false,
      stage: "no-user",
      reason,
      errorMessage: auth.error,
      projectId,
    })
    await persistPushSyncStatus(result)
    return result
  }

  const tokenResult = await fetchExpoPushTokenWhenGranted()
  if (tokenResult.permissionStatus !== "granted") {
    const result = buildResult({
      ok: false,
      stage: "permission-denied",
      reason,
      errorMessage: tokenResult.errorMessage ?? "OS permission not granted",
      permissionStatus: tokenResult.permissionStatus,
      projectId: tokenResult.projectId,
      userId: auth.userId,
    })
    await persistPushSyncStatus(result)
    return result
  }

  if (!tokenResult.token) {
    const result = buildResult({
      ok: false,
      stage: tokenResult.errorMessage?.includes("projectId") ? "missing-project-id" : "no-expo-token",
      reason,
      errorMessage: tokenResult.errorMessage ?? "Could not obtain Expo push token",
      permissionStatus: tokenResult.permissionStatus,
      projectId: tokenResult.projectId,
      userId: auth.userId,
    })
    await persistPushSyncStatus(result)
    return result
  }

  const upsertResult = await upsertPushTokenForUser(auth.userId, tokenResult.token, options)
  const result = buildResult({
    ...upsertResult,
    permissionStatus: tokenResult.permissionStatus,
    projectId: tokenResult.projectId,
    tokenPrefix: tokenPrefix(tokenResult.token),
    userId: auth.userId,
    reason,
  })
  await persistPushSyncStatus(result)
  return result
}

/** Upsert push token when OS permission is already granted (no native prompt). */
export async function registerPushTokenIfGranted(
  options?: RegisterPushTokenOptions
): Promise<boolean> {
  const result = await syncPushToken(options)
  return result.ok
}

/** Request OS permission (if needed), then register push token with Supabase. */
export async function requestNotificationPermissionAndRegister(
  options?: RegisterPushTokenOptions
): Promise<boolean> {
  if (Platform.OS === "web") return false

  const { status: existing, canAskAgain } = await Notifications.getPermissionsAsync()
  if (existing !== "granted") {
    if (!canAskAgain) return false
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== "granted") return false
    await enableRemoteNotificationPrefsOnGrant()
  }

  const result = await syncPushToken({
    ...options,
    force: true,
    reason: options?.reason ?? "permission-request",
  })
  return result.ok
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

/** Turn on remote notification categories after the user newly grants OS permission. */
export async function enableRemoteNotificationPrefsOnGrant(): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return false

  const { error } = await supabase
    .from("profiles")
    .update({
      notif_circles_week_before: true,
      notif_circles_day_before: true,
      notif_practice_updates: true,
    })
    .eq("id", auth.user.id)

  if (error) {
    console.warn("[Push] Failed to enable remote prefs on grant:", error.message)
    return false
  }

  saveLocalPrefs({ weekBefore: true, dayBefore: true })
  return true
}

/** Update practice update push preference in profiles. */
export async function updatePracticeUpdatesPref(enabled: boolean): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return true

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return true

  const { error } = await supabase
    .from("profiles")
    .update({ notif_practice_updates: enabled })
    .eq("id", auth.user.id)

  if (error) {
    console.warn("[Push] Failed to update practice updates pref:", error.message)
    return false
  }
  return true
}
