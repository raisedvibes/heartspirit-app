import { useEffect } from "react"
import { AppState } from "react-native"
import { useAuth } from "@/lib/auth"
import { registerPushTokenIfGranted } from "@/lib/pushTokenRegistration"

/**
 * Registers Expo push token after auth session is ready and on foreground resume.
 * Must render inside AuthProvider.
 */
export function PushTokenSync() {
  const { session, loading } = useAuth()
  const userId = session?.user?.id

  useEffect(() => {
    if (loading || !userId) return
    void registerPushTokenIfGranted({ reason: "session-ready", force: true })
  }, [loading, userId])

  useEffect(() => {
    if (!userId) return

    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void registerPushTokenIfGranted({ reason: "app-foreground" })
      }
    })

    return () => sub.remove()
  }, [userId])

  return null
}
