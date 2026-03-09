"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const ADMIN_EMAILS = ["guide@wellnessranger.com"]

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true

    async function checkAdmin() {
      if (!pathname?.startsWith("/admin")) {
        if (mounted) setReady(true)
        return
      }


      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
        alert(`Access denied. Logged in as: ${user?.email ?? "no user"}`)
        router.replace("/dashboard")
        return
      }

      if (mounted) setReady(true)
    }

    checkAdmin()

    return () => {
      mounted = false
    }
  }, [pathname, router])

  if (!ready) return null
  return <>{children}</>
}
