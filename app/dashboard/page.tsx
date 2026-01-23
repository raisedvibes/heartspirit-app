"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/layout/navigation"
import { Rituals } from "@/components/dashboard/rituals"
import { JournalQuickAccess } from "@/components/dashboard/journal-quick-access"
import { Circles } from "@/components/dashboard/circles"
import { EnergyCheck } from "@/components/dashboard/energy-check"
import TranslucentCard from "@/components/ui/translucent-card"
import { createClient } from "@/lib/supabase/client"

type ProfileRow = {
  display_name: string | null
  full_name: string | null
}

export default function DashboardPage() {
  const [userName, setUserName] = useState<string | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()

    const loadName = async () => {
      const { data: auth } = await supabase.auth.getUser()
      const user = auth?.user
      if (!user) return

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
    }

    loadName()
  }, [])

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden">
      <Navigation />

      <main className="app-main max-w-6xl mx-auto px-4 pb-10 md:pb-16 lg:pb-28">
        <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto space-y-10 mt-12">
          {/* ✅ Energy Check */}
          <div className="w-full">
            <EnergyCheck userName={userName} />
          </div>

          {/* 🕯 Daily Rituals + Journal + Circles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full items-stretch">
            <TranslucentCard>
              <Rituals />
            </TranslucentCard>

            <TranslucentCard>
              <JournalQuickAccess />
            </TranslucentCard>

            <TranslucentCard>
              <Circles />
            </TranslucentCard>
          </div>
        </div>
      </main>
    </div>
  )
}
