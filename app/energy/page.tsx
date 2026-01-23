"use client"

import { useEffect, useMemo, useState } from "react"
import { Navigation } from "@/components/layout/navigation"
import { EnergyCheck } from "@/components/dashboard/energy-check"
import { TranslucentCard } from "@/components/ui/translucent-card"
import { ActionRow } from "@/components/ui/action-row"
import { createClient } from "@/lib/supabase/client"

type ProfileRow = {
  display_name: string | null
  full_name: string | null
}

type SeasonKey = "Winter" | "Spring" | "Summer" | "Autumn"

type SeasonDatesRow = {
  year: number
  spring_equinox: string // YYYY-MM-DD
  summer_solstice: string // YYYY-MM-DD
  autumn_equinox: string // YYYY-MM-DD
  winter_solstice: string // YYYY-MM-DD
}

function toLocalStartOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function parseYYYYMMDDLocal(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0)
}

function getFallbackSeasonBoundaries(year: number) {
  return {
    spring: new Date(year, 2, 20, 0, 0, 0, 0), // Mar 20
    summer: new Date(year, 5, 20, 0, 0, 0, 0), // Jun 20
    autumn: new Date(year, 8, 22, 0, 0, 0, 0), // Sep 22
    winter: new Date(year, 11, 21, 0, 0, 0, 0), // Dec 21
  }
}

function computeSeason(
  today: Date,
  boundaries: { spring: Date; summer: Date; autumn: Date; winter: Date },
): SeasonKey {
  const t = toLocalStartOfDay(today)
  if (t >= boundaries.winter || t < boundaries.spring) return "Winter"
  if (t >= boundaries.spring && t < boundaries.summer) return "Spring"
  if (t >= boundaries.summer && t < boundaries.autumn) return "Summer"
  return "Autumn"
}

export default function EnergyPage() {
  const [userName, setUserName] = useState<string | undefined>(undefined)
  const [season, setSeason] = useState<SeasonKey>("Winter")

  const todayPractices = useMemo(
    () => [
      { title: "Open the Portal", subtitle: "morning" },
      { title: "Hold the Frequency", subtitle: "mid-day" },
      { title: "Return to Source", subtitle: "evening" },
    ],
    [],
  )

  useEffect(() => {
    const supabase = createClient()

    const load = async () => {
      const { data: auth } = await supabase.auth.getUser()
      const user = auth?.user

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, full_name")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>()

        const name =
          profile?.display_name?.trim() || profile?.full_name?.trim() || undefined
        if (name) setUserName(name)
      }

      const now = new Date()
      const year = now.getFullYear()

      const { data: seasonDates } = await supabase
        .from("season_dates")
        .select("year, spring_equinox, summer_solstice, autumn_equinox, winter_solstice")
        .eq("year", year)
        .maybeSingle<SeasonDatesRow>()

      if (seasonDates) {
        const boundaries = {
          spring: parseYYYYMMDDLocal(seasonDates.spring_equinox),
          summer: parseYYYYMMDDLocal(seasonDates.summer_solstice),
          autumn: parseYYYYMMDDLocal(seasonDates.autumn_equinox),
          winter: parseYYYYMMDDLocal(seasonDates.winter_solstice),
        }
        setSeason(computeSeason(now, boundaries))
      } else {
        setSeason(computeSeason(now, getFallbackSeasonBoundaries(year)))
      }
    }

    load()
  }, [])

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden">
      <Navigation />

      <main className="app-main max-w-6xl mx-auto px-4 pb-10 md:pb-16 lg:pb-28">
        <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto space-y-6 mt-12">
          {/* ✅ Energy Check */}
          <div className="w-full">
            <EnergyCheck userName={userName} />
          </div>

          {/* 🗓 Today */}
          <TranslucentCard className="p-4 sm:p-6 lg:p-8 overflow-hidden">
            <div className="space-y-4 sm:space-y-6 max-w-[720px] mx-auto">
              <h3 className="text-base font-semibold text-white">Today</h3>

              <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                {todayPractices.map((p) => (
                  <ActionRow
                    key={p.title}
                    title={p.title}
                    subtitle={p.subtitle}
                    onClick={() => console.log("[energy] today practice clicked:", p.title)}
                  />
                ))}
              </div>
            </div>
          </TranslucentCard>

          {/* 🍃 Seasonal */}
          <TranslucentCard className="p-4 sm:p-6 lg:p-8 overflow-hidden">
            <div className="space-y-4 sm:space-y-6 max-w-[720px] mx-auto">
              <h3 className="text-base font-semibold text-white">{season}</h3>

              <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                <ActionRow
                  title="Seasonal Practice (Placeholder)"
                  onClick={() => console.log("[energy] seasonal placeholder 1")}
                />
                <ActionRow
                  title="Seasonal Practice (Placeholder)"
                  onClick={() => console.log("[energy] seasonal placeholder 2")}
                />
              </div>
            </div>
          </TranslucentCard>
        </div>
      </main>
    </div>
  )
}
