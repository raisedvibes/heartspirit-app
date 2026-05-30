import { useEffect } from "react"
import * as Linking from "expo-linking"
import { useRouter, useSegments } from "expo-router"

import { useAuth } from "./auth"
import { createSessionFromAuthUrl, isPasswordRecoveryUrl } from "./authDeepLink"

/** Listens for Supabase recovery deep links and routes to reset-password when pending. */
export function AuthRecoveryHandler() {
  const { pendingPasswordRecovery, loading, markPendingPasswordRecovery } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || !isPasswordRecoveryUrl(url)) return
      const success = await createSessionFromAuthUrl(url)
      if (success) markPendingPasswordRecovery()
    }

    void Linking.getInitialURL().then(handleUrl)

    const subscription = Linking.addEventListener("url", ({ url }) => {
      void handleUrl(url)
    })

    return () => subscription.remove()
  }, [markPendingPasswordRecovery])

  useEffect(() => {
    if (loading || !pendingPasswordRecovery) return
    if (segments[0] === "reset-password") return
    router.replace("/reset-password")
  }, [loading, pendingPasswordRecovery, router, segments])

  return null
}
