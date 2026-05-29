import { useEffect, useRef } from "react"
import * as Notifications from "expo-notifications"
import { useRouter } from "expo-router"

const CIRCLE_NOTIFICATION_TYPES = new Set([
  "circle_reminder",
  "circle_activity",
  "circle_manual",
])

function getNotificationData(response: Notifications.NotificationResponse): Record<string, unknown> | null {
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return null
  const data = response.notification.request.content.data
  if (!data || typeof data !== "object") return null
  return data as Record<string, unknown>
}

function isCircleNotificationTap(response: Notifications.NotificationResponse): boolean {
  const data = getNotificationData(response)
  if (!data) return false
  const type = data.type
  return typeof type === "string" && CIRCLE_NOTIFICATION_TYPES.has(type)
}

function getPracticeNewTapTarget(response: Notifications.NotificationResponse): string | null {
  const data = getNotificationData(response)
  if (!data || data.type !== "practice_new") return null
  const practiceId = data.practiceId
  return typeof practiceId === "string" && practiceId.trim() ? `/practice/${practiceId.trim()}` : null
}

/** Routes push notification taps to the appropriate in-app screen. */
export function NotificationTapHandler() {
  const router = useRouter()
  const lastNotificationResponse = Notifications.useLastNotificationResponse()
  const handledIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (lastNotificationResponse === undefined || !lastNotificationResponse) return

    const id = lastNotificationResponse.notification.request.identifier
    if (handledIdRef.current === id) return

    const practiceTarget = getPracticeNewTapTarget(lastNotificationResponse)
    if (practiceTarget) {
      handledIdRef.current = id
      router.replace(practiceTarget)
      return
    }

    if (!isCircleNotificationTap(lastNotificationResponse)) return

    handledIdRef.current = id
    router.replace("/circles")
  }, [lastNotificationResponse, router])

  return null
}
