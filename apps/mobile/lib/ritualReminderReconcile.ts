export const RITUAL_NOTIFICATION_TYPE = "ritual_reminder"
export const PRACTICE_TIMER_NOTIFICATION_TYPE = "practice_timer_complete"
export const RITUAL_CHANNEL_ID = "ritual-reminders"

export type PendingLocalNotification = {
  identifier: string
  content: {
    title?: string | null
    data?: Record<string, unknown> | null
  }
  trigger?: unknown
}

export type RitualReminderSnapshot = {
  id: string
  name: string
  reminder?: string
  notificationId?: string
}

export type RitualNotificationIdPatch = {
  ritualId: string
  notificationId: string
}

export type RitualReminderRecreate = {
  ritualId: string
  ritualName: string
  hhmm: string
}

export type RitualReminderReconcilePlan = {
  keepIds: string[]
  patches: RitualNotificationIdPatch[]
  recreate: RitualReminderRecreate[]
  verifiedRitualIds: string[]
  repairedRitualIds: string[]
  missingRitualIds: string[]
  orphanIds: string[]
}

function reminderData(notification: PendingLocalNotification): {
  type?: string
  ritualId?: string
} {
  const data = notification.content.data ?? {}
  const type = typeof data.type === "string" ? data.type : undefined
  const ritualId = typeof data.ritualId === "string" ? data.ritualId : undefined
  return { type, ritualId }
}

function triggerChannelId(notification: PendingLocalNotification): string {
  const trigger = notification.trigger
  if (trigger && typeof trigger === "object" && "channelId" in trigger) {
    return String((trigger as { channelId?: unknown }).channelId ?? "")
  }
  return ""
}

export function parseRitualReminderHhmm(
  reminder?: string
): { hour: number; minute: number } | null {
  if (!reminder) return null
  const match = /^(\d{1,2}):(\d{2})$/.exec(reminder.trim())
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

export function notificationLooksLikeRitualReminder(
  notification: PendingLocalNotification
): boolean {
  const data = reminderData(notification)
  if (data.type === PRACTICE_TIMER_NOTIFICATION_TYPE) return false
  const title = notification.content.title ?? ""

  if (data.type === RITUAL_NOTIFICATION_TYPE) return true
  if (data.ritualId) return true
  if (triggerChannelId(notification) === RITUAL_CHANNEL_ID) return true
  if (title.startsWith("Ritual:")) return true
  return false
}

function isLegacyTitleOnlyNotification(
  notification: PendingLocalNotification
): boolean {
  const data = reminderData(notification)
  if (data.ritualId) return false
  if (data.type && data.type !== RITUAL_NOTIFICATION_TYPE) return false
  return notificationLooksLikeRitualReminder(notification)
}

export function findMatchingRitualNotification(
  ritual: RitualReminderSnapshot,
  pending: PendingLocalNotification[],
  takenIds: Set<string>
): PendingLocalNotification | undefined {
  const candidates = pending.filter(
    (notification) =>
      !takenIds.has(notification.identifier) &&
      notificationLooksLikeRitualReminder(notification)
  )

  if (ritual.notificationId) {
    const byStoredId = candidates.find(
      (notification) => notification.identifier === ritual.notificationId
    )
    if (byStoredId) return byStoredId
  }

  return candidates.find((notification) => {
    const data = reminderData(notification)
    if (data.ritualId !== ritual.id) return false
    if (data.type && data.type !== RITUAL_NOTIFICATION_TYPE) return false
    return true
  })
}

/**
 * Pair leftover reminder-enabled rituals to leftover title-only OS notifications
 * one-to-one. Each identifier is consumed at most once. Same-name rituals never
 * share a single legacy notification; extras are left unmatched (recreate).
 */
export function assignLegacyTitleMatches(
  unmatchedRituals: RitualReminderSnapshot[],
  pending: PendingLocalNotification[],
  takenIds: Set<string>
): Map<string, PendingLocalNotification> {
  const assignments = new Map<string, PendingLocalNotification>()
  const ritualsByTitle = new Map<string, RitualReminderSnapshot[]>()

  for (const ritual of unmatchedRituals) {
    const title = `Ritual: ${ritual.name}`
    const group = ritualsByTitle.get(title)
    if (group) group.push(ritual)
    else ritualsByTitle.set(title, [ritual])
  }

  for (const [title, group] of ritualsByTitle) {
    const available = pending.filter(
      (notification) =>
        !takenIds.has(notification.identifier) &&
        isLegacyTitleOnlyNotification(notification) &&
        (notification.content.title ?? "") === title
    )
    const pairCount = Math.min(group.length, available.length)
    for (let i = 0; i < pairCount; i++) {
      const notification = available[i]
      takenIds.add(notification.identifier)
      assignments.set(group[i].id, notification)
    }
  }

  return assignments
}

/**
 * True only when switching from one authenticated account to a different one.
 * False for first assignment, session-null/anonymous restore, and user→null
 * so a transient logged-out flash does not wipe the signed-in user's schedules.
 * Explicit Settings sign-out/account deletion still cancel ritual notifications.
 */
export function shouldCancelOutgoingRitualReminders(
  previousUserId: string | null | undefined,
  nextUserId: string | null
): boolean {
  return (
    typeof previousUserId === "string" &&
    typeof nextUserId === "string" &&
    previousUserId !== nextUserId
  )
}

/**
 * Empty anonymous hydration during session restore must not wipe OS schedules.
 * An empty authenticated store (or authenticated→authenticated switch) may still
 * cancel leftover ritual reminders.
 */
export function shouldCancelLeftoverRitualRemindersOnEmptyHydrate(
  switchingAwayFromAuthenticatedUser: boolean,
  userId: string | null
): boolean {
  return switchingAwayFromAuthenticatedUser || Boolean(userId)
}

export function applyNotificationIdPatchesToRituals<
  T extends { id: string; notificationId?: string },
>(rituals: T[], patches: RitualNotificationIdPatch[]): T[] {
  if (patches.length === 0) return rituals
  const byId = new Map(patches.map((patch) => [patch.ritualId, patch.notificationId]))
  let changed = false
  const next = rituals.map((ritual) => {
    const notificationId = byId.get(ritual.id)
    if (!notificationId || ritual.notificationId === notificationId) return ritual
    changed = true
    return { ...ritual, notificationId }
  })
  return changed ? next : rituals
}

function recordMatch(
  ritual: RitualReminderSnapshot,
  match: PendingLocalNotification,
  keepIds: string[],
  verifiedRitualIds: string[],
  repairedRitualIds: string[],
  patches: RitualNotificationIdPatch[]
) {
  keepIds.push(match.identifier)
  if (ritual.notificationId === match.identifier) {
    verifiedRitualIds.push(ritual.id)
  } else {
    repairedRitualIds.push(ritual.id)
    patches.push({ ritualId: ritual.id, notificationId: match.identifier })
  }
}

export function planRitualReminderReconciliation(
  rituals: RitualReminderSnapshot[],
  pending: PendingLocalNotification[]
): RitualReminderReconcilePlan {
  const keepIds: string[] = []
  const takenIds = new Set<string>()
  const patches: RitualNotificationIdPatch[] = []
  const recreate: RitualReminderRecreate[] = []
  const verifiedRitualIds: string[] = []
  const repairedRitualIds: string[] = []
  const missingRitualIds: string[] = []
  const unmatched: RitualReminderSnapshot[] = []

  for (const ritual of rituals) {
    const hhmm = parseRitualReminderHhmm(ritual.reminder)
    if (!hhmm) continue

    const match = findMatchingRitualNotification(ritual, pending, takenIds)
    if (match) {
      takenIds.add(match.identifier)
      recordMatch(
        ritual,
        match,
        keepIds,
        verifiedRitualIds,
        repairedRitualIds,
        patches
      )
      continue
    }

    unmatched.push(ritual)
  }

  const legacyAssignments = assignLegacyTitleMatches(unmatched, pending, takenIds)
  for (const ritual of unmatched) {
    const match = legacyAssignments.get(ritual.id)
    if (match) {
      recordMatch(
        ritual,
        match,
        keepIds,
        verifiedRitualIds,
        repairedRitualIds,
        patches
      )
      continue
    }

    missingRitualIds.push(ritual.id)
    recreate.push({
      ritualId: ritual.id,
      ritualName: ritual.name,
      hhmm: ritual.reminder!.trim(),
    })
  }

  const orphanIds = pending
    .filter(
      (notification) =>
        notificationLooksLikeRitualReminder(notification) &&
        !takenIds.has(notification.identifier)
    )
    .map((notification) => notification.identifier)

  return {
    keepIds,
    patches,
    recreate,
    verifiedRitualIds,
    repairedRitualIds,
    missingRitualIds,
    orphanIds,
  }
}
