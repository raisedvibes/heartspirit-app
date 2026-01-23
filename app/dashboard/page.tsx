"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardView } from "@/components/pages/DashboardView"

type ProfileRow = {
  display_name: string | null
  full_name: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [userName, setUserName] = useState<string | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()

    const load = async () => {
      // 1) Require auth
      const { data: auth } = await supabase.auth.getUser()
      const user = auth?.user

      if (!user) {
        router.replace("/login")
        return
      }

      // 2) Load profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, full_name")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>()

      const name =
        profile?.display_name?.trim() ||
        profile?.full_name?.trim() ||
        undefined

      if (name) setUserName(name)

      setReady(true)
    }

    load()
  }, [router])

  // Prevent UI flash while auth loads
  if (!ready) return null

  return <DashboardView userName={userName} />
}
