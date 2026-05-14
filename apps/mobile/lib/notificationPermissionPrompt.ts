import * as Notifications from "expo-notifications"
import { Alert, Linking, Platform } from "react-native"
import { registerPushTokenIfGranted, requestNotificationPermissionAndRegister } from "./pushTokenRegistration"

let circlesSoftPromptShownThisSession = false

export function wasCirclesSoftPromptShownThisSession(): boolean {
  return circlesSoftPromptShownThisSession
}

export function markCirclesSoftPromptShownThisSession(): void {
  circlesSoftPromptShownThisSession = true
}

export async function isNotificationPermissionGranted(): Promise<boolean> {
  if (Platform.OS === "web") return false
  const { status } = await Notifications.getPermissionsAsync()
  return status === "granted"
}

export async function getNotificationPermissionState(): Promise<{
  granted: boolean
  canAskAgain: boolean
}> {
  if (Platform.OS === "web") return { granted: false, canAskAgain: false }
  const settings = await Notifications.getPermissionsAsync()
  return {
    granted: settings.granted,
    canAskAgain: settings.canAskAgain !== false,
  }
}

/** Shared soft-prompt copy for contextual notification asks. */
export const STAY_IN_RHYTHM_PROMPT = {
  title: "Stay in rhythm",
  body: "Heartspirit will remind you of your rituals, practice completions, and upcoming circles.",
  primaryLabel: "Enable Notifications",
  secondaryLabel: "Not Now",
} as const

export async function openNotificationSettings(): Promise<void> {
  try {
    await Linking.openSettings()
  } catch {
    Alert.alert(
      "Notifications",
      "Enable notifications for Heartspirit in your device Settings app."
    )
  }
}

/** Custom prompt primary action: request OS permission (if allowed) and register push token. */
export async function enableNotificationsFromPrompt(): Promise<boolean> {
  const before = await Notifications.getPermissionsAsync()
  if (before.status === "granted") {
    return registerPushTokenIfGranted()
  }

  if (!before.canAskAgain) {
    await openNotificationSettings()
    Alert.alert(
      "Notifications",
      "Turn on notifications for Heartspirit in Settings to receive reminders."
    )
    return false
  }

  const granted = await requestNotificationPermissionAndRegister()
  if (!granted) {
    const after = await Notifications.getPermissionsAsync()
    if (!after.canAskAgain) {
      await openNotificationSettings()
      Alert.alert(
        "Notifications",
        "Turn on notifications for Heartspirit in Settings to receive reminders."
      )
    }
  }
  return granted
}
