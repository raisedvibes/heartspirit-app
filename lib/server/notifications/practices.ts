import type { SupabaseClient } from "@supabase/supabase-js"
import { getCircleNotificationRecipients } from "./circles"
import { sendExpoPushMessages } from "./expo"

const ANDROID_PUSH_CHANNEL_ID = "default"
const PUSH_TITLE = "New practice available"

type PracticeRow = {
  id: string
  title: string | null
  short_summary: string | null
}

type PracticeProfilePref = {
  id: string
  notif_practice_updates: boolean | null
}

export type ManualPracticePushResult = {
  ok: boolean
  error?: string
  usersScanned: number
  tokensFound: number
  sent: number
  failed: number
  skipped: number
  skippedNoPrefs: number
  skippedNoTokens: number
  skippedDuplicate: number
}

function practicePushBody(practice: PracticeRow): string {
  const title = practice.title?.trim()
  if (title) return `Return inward with ${title}`

  const summary = practice.short_summary?.trim()
  if (summary) return summary

  return "A new practice is ready for you."
}

function wantsPracticeUpdates(profile: PracticeProfilePref | undefined): boolean {
  if (!profile) return false
  return profile.notif_practice_updates !== false
}

async function getPracticePushProfiles(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, PracticeProfilePref>> {
  if (!userIds.length) return new Map()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, notif_practice_updates")
    .in("id", userIds)
  if (error) throw new Error(`profiles query failed: ${error.message}`)
  return new Map(((data ?? []) as PracticeProfilePref[]).map((r) => [r.id, r]))
}

export async function sendManualPracticePushNow(
  supabase: SupabaseClient,
  practiceId: string
): Promise<ManualPracticePushResult> {
  const empty = (): Omit<ManualPracticePushResult, "ok" | "error"> => ({
    usersScanned: 0,
    tokensFound: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    skippedNoPrefs: 0,
    skippedNoTokens: 0,
    skippedDuplicate: 0,
  })

  const { data: practiceRow, error: practiceErr } = await supabase
    .from("practices")
    .select("id, title, short_summary")
    .eq("id", practiceId)
    .maybeSingle()

  if (practiceErr) {
    return { ok: false, error: `Failed to load practice: ${practiceErr.message}`, ...empty() }
  }
  if (!practiceRow) {
    return { ok: false, error: "Practice not found", ...empty() }
  }

  const practice = practiceRow as PracticeRow
  const { userIds, tokensByUser, tokensFound } = await getCircleNotificationRecipients(supabase)
  const usersScanned = userIds.length

  if (!userIds.length) {
    return {
      ok: true,
      ...empty(),
      skipped: 1,
      skippedNoTokens: 1,
    }
  }

  const profiles = await getPracticePushProfiles(supabase, userIds)
  const body = practicePushBody(practice)

  let sent = 0
  let failed = 0
  let skippedNoPrefs = 0
  let skippedNoTokens = 0

  for (const userId of userIds) {
    const profile = profiles.get(userId)
    const tokens = tokensByUser.get(userId) ?? []

    if (!wantsPracticeUpdates(profile)) {
      skippedNoPrefs += 1
      continue
    }

    if (!tokens.length) {
      skippedNoTokens += 1
      continue
    }

    const result = await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title: PUSH_TITLE,
        body,
        sound: "default",
        channelId: ANDROID_PUSH_CHANNEL_ID,
        data: {
          type: "practice_new",
          practiceId: practice.id,
        },
      }))
    )

    sent += result.sent
    failed += result.failed
  }

  const skipped = skippedNoPrefs + skippedNoTokens

  return {
    ok: true,
    usersScanned,
    tokensFound,
    sent,
    failed,
    skipped,
    skippedNoPrefs,
    skippedNoTokens,
    skippedDuplicate: 0,
  }
}
