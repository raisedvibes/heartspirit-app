"use client"

import { useEffect, useMemo, useState } from "react"
import { Navigation } from "@/components/layout/navigation"
import { EnergyCheck } from "@/components/dashboard/energy-check"
import { TranslucentCard } from "@/components/ui/translucent-card"
import { Button } from "@/components/ui/button"
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

/**
 * Fallback dates (typical) if Supabase season dates are not configured yet.
 * Replace with real dates per year via the `season_dates` table.
 */
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

  // Winter spans: winter_solstice -> end of year, plus start of year -> before spring_equinox
  if (t >= boundaries.winter || t < boundaries.spring) return "Winter"
  if (t >= boundaries.spring && t < boundaries.summer) return "Spring"
  if (t >= boundaries.summer && t < boundaries.autumn) return "Summer"
  return "Autumn"
}

function PracticeRow({
  title,
  subtitle,
  onClick,
}: {
  title: string
  subtitle?: string
  onClick?: () => void
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick}
      className="w-full h-auto justify-start text-left rounded-xl px-4 py-3 whitespace-normal"
    >
      <div className="flex flex-col items-start">
        <span className="text-sm font-semibold text-card-foreground">{title}</span>
        {subtitle ? (
          <span className="text-xs text-muted-foreground/70 mt-1">{subtitle}</span>
        ) : null}
      </div>
    </Button>
  )
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
      // Load user name
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

      // Load season based on equinox/solstice dates (Supabase table), fallback otherwise
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
          <TranslucentCard>
            <div className="p-6">
              <h3 className="text-base font-semibold text-card-foreground mb-4">Today</h3>

              <div className="space-y-3">
                {todayPractices.map((p) => (
                  <PracticeRow
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
          <TranslucentCard>
            <div className="p-6">
              <h3 className="text-base font-semibold text-card-foreground mb-4">{season}</h3>

              <div className="space-y-3">
                <PracticeRow
                  title="Seasonal Practice (Placeholder)"
                  onClick={() => console.log("[energy] seasonal placeholder 1")}
                />
                <PracticeRow
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
