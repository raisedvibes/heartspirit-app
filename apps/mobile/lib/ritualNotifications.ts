import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

const RITUAL_CHANNEL_ID = "ritual-reminders"

export async function ensureNotifPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync()
  if (settings.granted) return true

  const req = await Notifications.requestPermissionsAsync()
  return req.granted
}

export async function scheduleDailyReminder(
  title: string,
  body: string,
  time: Date
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
    time
  )

  return id
}

export async function schedulePracticeTimerCompletion(
  title: string,
  body: string,
  secondsUntilEnd: number
): Promise<string | null> {
  if (!(await ensureNotifPermissions())) {
    return null
  }

  await ensureRitualChannel()

  const safeSeconds = Math.max(1, Math.ceil(secondsUntilEnd))
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      ...(Platform.OS === "android" ? { channelId: RITUAL_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: safeSeconds,
      repeats: false,
      ...(Platform.OS === "android" ? { channelId: RITUAL_CHANNEL_ID } : {}),
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