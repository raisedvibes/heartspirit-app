import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import type { Ritual } from "./ritualsStore"

const RITUAL_CHANNEL_ID = "ritual-reminders"
const PRACTICE_TIMER_CHANNEL_ID = "practice_timer"
const PRACTICE_TIMER_SOUND = "heartspirit_chime"
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

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? { type: RITUAL_NOTIFICATION_TYPE },
      ...(Platform.OS === "android" ? { channelId: RITUAL_CHANNEL_ID } : {}),
    },
    trigger: Platform.select({
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
    })!,
  })

  return id
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
      sound: PRACTICE_TIMER_SOUND,
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
  if (!(await ensureNotifPermissions())) {
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
  secondsUntilEnd: number
): Promise<string | null> {
  if (!(await hasNotifPermissions())) {
    return null
  }

  await ensurePracticeTimerChannel()

  const safeSeconds = Math.max(1, Math.ceil(secondsUntilEnd))
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: PRACTICE_TIMER_SOUND,
      ...(Platform.OS === "android" ? { channelId: PRACTICE_TIMER_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: safeSeconds,
      repeats: false,
      ...(Platform.OS === "android" ? { channelId: PRACTICE_TIMER_CHANNEL_ID } : {}),
    },
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