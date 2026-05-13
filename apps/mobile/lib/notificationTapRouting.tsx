import { useEffect, useRef } from "react"
import * as Notifications from "expo-notifications"
import { useRouter } from "expo-router"

const CIRCLE_NOTIFICATION_TYPES = new Set([
  "circle_reminder",
  "circle_activity",
  "circle_manual",
])

function isCircleNotificationTap(response: Notifications.NotificationResponse): boolean {
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return false
  const data = response.notification.request.content.data
  if (!data || typeof data !== "object") return false
  const type = (data as Record<string, unknown>).type
  return typeof type === "string" && CIRCLE_NOTIFICATION_TYPES.has(type)
}

/** Routes circle push notification taps to the Circles tab. */
export function NotificationTapHandler() {
  const router = useRouter()
  const lastNotificationResponse = Notifications.useLastNotificationResponse()
  const handledIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (lastNotificationResponse === undefined || !lastNotificationResponse) return
    if (!isCircleNotificationTap(lastNotificationResponse)) return

    const id = lastNotificationResponse.notification.request.identifier
    if (handledIdRef.current === id) return
    handledIdRef.current = id

    router.replace("/circles")
  }, [lastNotificationResponse, router])

  return null
}
