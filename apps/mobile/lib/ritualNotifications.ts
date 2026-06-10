import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import { configureGlobalNotificationHandler } from "./notificationHandler"
import type { Ritual } from "./ritualsStore"

const RITUAL_CHANNEL_ID = "ritual-reminders"
const PRACTICE_TIMER_CHANNEL_ID = "practice_timer_v2"
const PRACTICE_TIMER_SOUND_ANDROID = "heartspirit_chime"
const PRACTICE_TIMER_SOUND_IOS = "heartspirit_chime.mp3"
const PRACTICE_TIMER_NOTIFICATION_TYPE = "practice_timer_complete"
const RITUAL_NOTIFICATION_TYPE = "ritual_reminder"

type ReminderData = {
  type?: string
  ritualId?: string
}

export async function ensureNotifPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync()
  if (settings.granted) return true

  const req = await Notifications.requestPermissionsAsync()
  return req.granted
}

/** Check permission only — does not show the native OS prompt. */
export async function hasNotifPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync()
  return settings.granted
}

export async function scheduleDailyReminder(
  title: string,
  body: string,
  time: Date,
  data?: ReminderData
) {
  const hour = time.getHours()
  const minute = time.getMinutes()

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(RITUAL_CHANNEL_ID, {
      name: "Ritual reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    })
  }

  const trigger = Platform.select({
    ios: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
    android: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      channelId: RITUAL_CHANNEL_ID,
      hour,
      minute,
    },
    default: null,
  })!

  const content = {
    title,
    body,
    sound: "default" as const,
    data: data ?? { type: RITUAL_NOTIFICATION_TYPE },
    ...(Platform.OS === "android" ? { channelId: RITUAL_CHANNEL_ID } : {}),
  }

  console.log("[ritual reminder notif] before scheduleNotificationAsync", {
    title,
    body,
    hour,
    minute,
    platform: Platform.OS,
    trigger,
  })

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger,
    })
    console.log("[ritual reminder notif] after scheduleNotificationAsync", { id })
    return id
  } catch (error) {
    console.error("[ritual reminder notif] scheduleNotificationAsync error", error)
    throw error
  }
}

async function ensureRitualChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(RITUAL_CHANNEL_ID, {
      name: "Ritual reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    })
  }
}

async function ensurePracticeTimerChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(PRACTICE_TIMER_CHANNEL_ID, {
      name: "Practice timer",
      importance: Notifications.AndroidImportance.HIGH,
      sound: PRACTICE_TIMER_SOUND_ANDROID,
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.NOTIFICATION,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      },
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    })
  }
}

/**
 * Schedule a repeating daily notification for a ritual at the given time.
 * @returns Notification identifier, or null if permissions were denied.
 */
export async function scheduleRitualReminder(
  ritualId: string,
  ritualName: string,
  hhmm: string
): Promise<string | null> {
  if (!(await hasNotifPermissions())) {
    return null
  }

  const [h, m] = hhmm.split(":").map(Number)
  const hour = isNaN(h) ? 8 : h
  const minute = isNaN(m) ? 0 : m

  const time = new Date()
  time.setHours(hour, minute, 0, 0)

  const id = await scheduleDailyReminder(
    `Ritual: ${ritualName}`,
    "",
    time,
    { type: RITUAL_NOTIFICATION_TYPE, ritualId }
  )

  return id
}

export async function schedulePracticeTimerCompletion(
  title: string,
  body: string,
  secondsUntilEnd: number,
  endAtMs?: number
): Promise<string | null> {
  configureGlobalNotificationHandler()

  const permission = await Notifications.getPermissionsAsync()
  console.log("[practice timer notif] permission", {
    granted: permission.granted,
    status: permission.status,
  })
  if (!permission.granted) {
    console.log("[practice timer notif] skipped — notifications not granted")
    return null
  }

  await ensurePracticeTimerChannel()

  const safeSeconds = Math.max(1, Math.ceil(secondsUntilEnd))
  const fireDate = new Date(
    typeof endAtMs === "number" && endAtMs > Date.now()
      ? endAtMs
      : Date.now() + safeSeconds * 1000
  )

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: Platform.OS === "ios" ? PRACTICE_TIMER_SOUND_IOS : PRACTICE_TIMER_SOUND_ANDROID,
      data: { type: PRACTICE_TIMER_NOTIFICATION_TYPE },
      ...(Platform.OS === "android" ? { channelId: PRACTICE_TIMER_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
      ...(Platform.OS === "android" ? { channelId: PRACTICE_TIMER_CHANNEL_ID } : {}),
    },
  })

  const pending = await Notifications.getAllScheduledNotificationsAsync()
  console.log("[practice timer notif] scheduled", {
    id,
    channelId: PRACTICE_TIMER_CHANNEL_ID,
    sound: Platform.OS === "ios" ? PRACTICE_TIMER_SOUND_IOS : PRACTICE_TIMER_SOUND_ANDROID,
    fireDate: fireDate.toISOString(),
    secondsUntilEnd: safeSeconds,
    pendingCount: pending.length,
  })

  return id
}

export async function cancelScheduledNotification(
  notificationId: string | null | undefined
) {
  if (!notificationId) return
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
  } catch (error) {
    console.log("[notifications] failed to cancel scheduled notification", error)
  }
}

function notificationLooksLikeRitualReminder(
  notification: Notifications.NotificationRequest
): boolean {
  const data = (notification.content.data ?? {}) as ReminderData
  const title = notification.content.title ?? ""
  const trigger = notification.trigger
  const triggerChannelId =
    trigger && typeof trigger === "object" && "channelId" in trigger
      ? String(trigger.channelId ?? "")
      : ""

  if (data.type === RITUAL_NOTIFICATION_TYPE) return true
  if (data.ritualId) return true
  if (triggerChannelId === RITUAL_CHANNEL_ID) return true
  if (title.startsWith("Ritual:")) return true
  return false
}

/**
 * Cancel only ritual reminder notifications, preserving other notifications
 * like one-shot practice timer completion alerts.
 */
export async function cancelRitualReminderNotifications(
  knownNotificationIds: Array<string | null | undefined> = []
) {
  const knownIds = new Set(knownNotificationIds.filter(Boolean) as string[])
  const pending = await Notifications.getAllScheduledNotificationsAsync()

  for (const notification of pending) {
    if (knownIds.has(notification.identifier) || notificationLooksLikeRitualReminder(notification)) {
      await cancelScheduledNotification(notification.identifier)
    }
  }
}

/**
 * Ensure scheduled ritual reminders match the hydrated rituals list.
 * - No rituals -> no pending ritual reminders.
 * - Existing rituals -> keep only their known ids, cancel ritual orphans/legacy reminders.
 */
export async function reconcileRitualReminderNotifications(rituals: Ritual[]) {
  const knownIds = rituals.map((ritual) => ritual.notificationId).filter(Boolean) as string[]
  const knownSet = new Set(knownIds)
  const pending = await Notifications.getAllScheduledNotificationsAsync()

  for (const notification of pending) {
    const isKnown = knownSet.has(notification.identifier)
    const isRitual = notificationLooksLikeRitualReminder(notification)
    if (!isKnown && isRitual) {
      await cancelScheduledNotification(notification.identifier)
    }
  }
}