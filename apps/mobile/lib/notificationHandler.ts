import * as Notifications from "expo-notifications"

let notificationHandlerConfigured = false

/** Foreground display for all remote and local notifications (single global opt-in). */
export function configureGlobalNotificationHandler(): void {
  if (notificationHandlerConfigured) return
  notificationHandlerConfigured = true

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
}
