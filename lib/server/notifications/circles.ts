import { createHash, randomBytes } from "crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import { sendExpoPushMessages } from "./expo"

type ReminderKind = "week_before" | "day_before"
type ActivityKind = "activity"
type ManualKind = "manual_admin"
type CircleNotificationKind = ReminderKind | ActivityKind | ManualKind

type CircleRow = {
  id: string
  name: string
  starts_at: string | null
  description?: string | null
  is_published?: boolean
}

type CircleMember = { user_id: string; circle_id: string }
type ProfilePref = {
  id: string
  notif_circles_week_before: boolean | null
  notif_circles_day_before: boolean | null
}
type PushTokenRow = { user_id: string; expo_push_token: string }

const LOOKBACK_HOURS = 26

function iso(d: Date): string {
  return d.toISOString()
}

function shiftDays(dateIso: string, days: number): Date {
  const d = new Date(dateIso)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function isDueWindow(target: Date, now: Date, lookbackHours = LOOKBACK_HOURS): boolean {
  const lookback = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000)
  return target <= now && target > lookback
}

function hashPayload(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

async function getCircleMembers(supabase: SupabaseClient, circleId: string): Promise<CircleMember[]> {
  const { data, error } = await supabase
    .from("circle_memberships")
    .select("user_id, circle_id")
    .eq("circle_id", circleId)
  if (error) throw new Error(`circle_memberships query failed: ${error.message}`)
  return (data ?? []) as CircleMember[]
}

async function getProfiles(supabase: SupabaseClient, userIds: string[]): Promise<Map<string, ProfilePref>> {
  if (!userIds.length) return new Map()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, notif_circles_week_before, notif_circles_day_before")
    .in("id", userIds)
  if (error) throw new Error(`profiles query failed: ${error.message}`)
  return new Map(((data ?? []) as ProfilePref[]).map((r) => [r.id, r]))
}

async function getTokens(supabase: SupabaseClient, userIds: string[]): Promise<Map<string, string[]>> {
  if (!userIds.length) return new Map()
  const { data, error } = await supabase
    .from("user_push_tokens")
    .select("user_id, expo_push_token")
    .in("user_id", userIds)
  if (error) throw new Error(`user_push_tokens query failed: ${error.message}`)

  const byUser = new Map<string, string[]>()
  for (const row of (data ?? []) as PushTokenRow[]) {
    if (!byUser.has(row.user_id)) byUser.set(row.user_id, [])
    byUser.get(row.user_id)!.push(row.expo_push_token)
  }
  return byUser
}

async function reserveSend(
  supabase: SupabaseClient,
  params: {
    userId: string
    circleId: string
    kind: CircleNotificationKind
    scheduledFor?: string | null
    payloadHash?: string | null
  }
): Promise<boolean> {
  const { data, error } = await supabase
    .from("circle_notification_sends")
    .insert(
      {
        user_id: params.userId,
        circle_id: params.circleId,
        kind: params.kind,
        scheduled_for: params.scheduledFor ?? null,
        payload_hash: params.payloadHash ?? null,
      },
      {
        onConflict: params.scheduledFor
          ? "user_id,circle_id,kind,scheduled_for"
          : "user_id,circle_id,kind,payload_hash",
        ignoreDuplicates: true,
      }
    )
    .select("id")
    .limit(1)

  if (error) {
    throw new Error(
      `circle_notification_sends insert failed (${params.kind}): ${error.message}. Run DB SQL setup first.`
    )
  }
  return !!data?.length
}

export async function sendCircleRemindersNow(supabase: SupabaseClient): Promise<{
  circlesScanned: number
  notificationsSent: number
  notificationsFailed: number
}> {
  const now = new Date()
  const upper = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000)

  const { data: circles, error } = await supabase
    .from("circles")
    .select("id, name, starts_at, is_published")
    .eq("is_published", true)
    .not("starts_at", "is", null)
    .gte("starts_at", iso(now))
    .lte("starts_at", iso(upper))

  if (error) throw new Error(`circles query failed: ${error.message}`)
  const upcoming = ((circles ?? []) as CircleRow[]).filter((c) => !!c.starts_at)

  let notificationsSent = 0
  let notificationsFailed = 0

  for (const circle of upcoming) {
    const startsAt = circle.starts_at as string
    const weekReminderAt = shiftDays(startsAt, -7)
    const dayReminderAt = shiftDays(startsAt, -1)

    const weekDue = isDueWindow(weekReminderAt, now)
    const dayDue = isDueWindow(dayReminderAt, now)
    if (!weekDue && !dayDue) continue

    const members = await getCircleMembers(supabase, circle.id)
    const userIds = [...new Set(members.map((m) => m.user_id))]
    if (!userIds.length) continue

    const [profiles, tokensByUser] = await Promise.all([
      getProfiles(supabase, userIds),
      getTokens(supabase, userIds),
    ])

    for (const userId of userIds) {
      const profile = profiles.get(userId)
      const tokens = tokensByUser.get(userId) ?? []
      if (!profile || !tokens.length) continue

      const wantsWeek = !!profile.notif_circles_week_before
      const wantsDay = !!profile.notif_circles_day_before

      const reminderKinds: ReminderKind[] = []
      if (weekDue && wantsWeek) reminderKinds.push("week_before")
      if (dayDue && wantsDay) reminderKinds.push("day_before")

      for (const kind of reminderKinds) {
        const scheduledFor = kind === "week_before" ? weekReminderAt.toISOString() : dayReminderAt.toISOString()
        const reserved = await reserveSend(supabase, {
          userId,
          circleId: circle.id,
          kind,
          scheduledFor,
        })
        if (!reserved) continue

        const label = kind === "week_before" ? "in 7 days" : "tomorrow"
        const result = await sendExpoPushMessages(
          tokens.map((to) => ({
            to,
            title: `Upcoming Circle: ${circle.name}`,
            body: `Your circle starts ${label}.`,
            sound: "default",
            data: {
              type: "circle_reminder",
              circleId: circle.id,
              startsAt,
              kind,
            },
          }))
        )

        notificationsSent += result.sent
        notificationsFailed += result.failed
      }
    }
  }

  return {
    circlesScanned: upcoming.length,
    notificationsSent,
    notificationsFailed,
  }
}

export async function sendCircleActivityNotification(
  supabase: SupabaseClient,
  params: {
    circleBefore: CircleRow | null
    circleAfter: CircleRow
    changedFields: string[]
  }
): Promise<{ sent: number; failed: number; skipped: boolean }> {
  const after = params.circleAfter
  if (!after.is_published) return { sent: 0, failed: 0, skipped: true }

  const important = new Set(["name", "starts_at", "description", "is_published"])
  const hasImportantChange = params.changedFields.some((f) => important.has(f))
  if (!hasImportantChange) return { sent: 0, failed: 0, skipped: true }

  const members = await getCircleMembers(supabase, after.id)
  const userIds = [...new Set(members.map((m) => m.user_id))]
  if (!userIds.length) return { sent: 0, failed: 0, skipped: true }

  const [profiles, tokensByUser] = await Promise.all([
    getProfiles(supabase, userIds),
    getTokens(supabase, userIds),
  ])

  let sent = 0
  let failed = 0

  for (const userId of userIds) {
    const profile = profiles.get(userId)
    const tokens = tokensByUser.get(userId) ?? []
    if (!profile || !tokens.length) continue

    const circlesEnabled = !!profile.notif_circles_week_before || !!profile.notif_circles_day_before
    if (!circlesEnabled) continue

    const payloadKey = `${after.id}:${after.name}:${after.starts_at ?? ""}:${after.description ?? ""}:${params.changedFields.join(",")}`
    const payloadHashActivity = hashPayload(payloadKey)
    const reserved = await reserveSend(supabase, {
      userId,
      circleId: after.id,
      kind: "activity",
      payloadHash: payloadHashActivity,
    })
    if (!reserved) continue

    const title =
      params.circleBefore === null
        ? `New Circle: ${after.name}`
        : after.starts_at !== params.circleBefore.starts_at
          ? `Circle Updated: ${after.name}`
          : `Circle Activity: ${after.name}`

    const body =
      after.starts_at
        ? `Latest details available. Starts ${new Date(after.starts_at).toLocaleString()}.`
        : "Latest details are now available."

    const result = await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title,
        body,
        sound: "default",
        data: {
          type: "circle_activity",
          circleId: after.id,
          changedFields: params.changedFields,
        },
      }))
    )

    sent += result.sent
    failed += result.failed
  }

  return { sent, failed, skipped: false }
}

export type ManualCirclePushResult = {
  ok: boolean
  error?: string
  sent: number
  failed: number
  skipped: number
  skippedNoMembers: number
  skippedNoPrefs: number
  skippedNoTokens: number
  skippedDuplicate: number
}

/**
 * Admin-only manual push: eligible members match activity notifications
 * (circle prefs on + push tokens). Each click uses a unique payload hash so
 * sends are not deduped against prior manual or cron sends.
 */
export async function sendManualCirclePushNow(
  supabase: SupabaseClient,
  circleId: string
): Promise<ManualCirclePushResult> {
  const empty = (): Omit<ManualCirclePushResult, "ok" | "error"> => ({
    sent: 0,
    failed: 0,
    skipped: 0,
    skippedNoMembers: 0,
    skippedNoPrefs: 0,
    skippedNoTokens: 0,
    skippedDuplicate: 0,
  })

  const { data: circleRow, error: circleErr } = await supabase
    .from("circles")
    .select("id, name, starts_at, is_published")
    .eq("id", circleId)
    .maybeSingle()

  if (circleErr) {
    return { ok: false, error: `Failed to load circle: ${circleErr.message}`, ...empty() }
  }
  if (!circleRow) {
    return { ok: false, error: "Circle not found", ...empty() }
  }

  const circle = circleRow as CircleRow
  if (!circle.is_published) {
    return { ok: false, error: "Circle is not published", ...empty() }
  }

  const members = await getCircleMembers(supabase, circle.id)
  const userIds = [...new Set(members.map((m) => m.user_id))]
  if (!userIds.length) {
    return {
      ok: true,
      ...empty(),
      skipped: 1,
      skippedNoMembers: 1,
    }
  }

  const batchNonce = randomBytes(12).toString("hex")

  const [profiles, tokensByUser] = await Promise.all([
    getProfiles(supabase, userIds),
    getTokens(supabase, userIds),
  ])

  let sent = 0
  let failed = 0
  let skippedNoPrefs = 0
  let skippedNoTokens = 0
  let skippedDuplicate = 0

  const when = circle.starts_at ? new Date(circle.starts_at).toLocaleString() : ""
  const body = when.trim() ? `${circle.name} — ${when}` : circle.name

  for (const userId of userIds) {
    const profile = profiles.get(userId)
    const tokens = tokensByUser.get(userId) ?? []

    if (!profile) {
      skippedNoPrefs += 1
      continue
    }

    const circlesEnabled = !!profile.notif_circles_week_before || !!profile.notif_circles_day_before
    if (!circlesEnabled) {
      skippedNoPrefs += 1
      continue
    }

    if (!tokens.length) {
      skippedNoTokens += 1
      continue
    }

    const payloadKey = `manual_admin:${circle.id}:${userId}:${batchNonce}`
    const payloadHash = hashPayload(payloadKey)
    const reserved = await reserveSend(supabase, {
      userId,
      circleId: circle.id,
      kind: "manual_admin",
      payloadHash,
    })
    if (!reserved) {
      skippedDuplicate += 1
      continue
    }

    const result = await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title: "Upcoming Circle",
        body,
        sound: "default",
        data: {
          type: "circle_manual",
          circleId: circle.id,
          startsAt: circle.starts_at ?? null,
        },
      }))
    )

    sent += result.sent
    failed += result.failed
  }

  const skipped = skippedNoPrefs + skippedNoTokens + skippedDuplicate

  return {
    ok: true,
    sent,
    failed,
    skipped,
    skippedNoMembers: 0,
    skippedNoPrefs,
    skippedNoTokens,
    skippedDuplicate,
  }
}
