"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Flame } from "lucide-react"
import { useRitualsStore, type Mark, localISODate } from "@/lib/rituals"

// Match Energy Check feeling-tone tiles: light glass + subtle border + dark text
const RITUAL_ROW =
  "flex items-center justify-between gap-3 rounded-lg " +
  "border-2 border-white/40 bg-white/10 " +
  "px-3 py-2 backdrop-blur-sm " +
  "hover:border-accent hover:bg-accent/20 transition-all duration-200"

// Small, readable toggle for today's mark (kept simple + consistent)
function TodayToggle({
  state,
  onChange,
}: {
  state?: Mark
  onChange: (m: Mark) => void
}) {
  const label = state === "yes" ? "✓" : state === "no" ? "×" : state === "skip" ? "–" : ""

  const base =
    "h-8 w-8 rounded-md border-2 text-center text-sm leading-8 transition " +
    "focus:outline-none focus:ring-2 focus:ring-accent/60 focus:ring-offset-1 focus:ring-offset-transparent"

  // Light-glass states so it doesn’t introduce harsh white blocks on the dashboard
  const style =
    state === "yes"
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-900 hover:bg-emerald-500/20"
      : state === "no"
      ? "border-rose-500/40 bg-rose-500/12 text-rose-900 hover:bg-rose-500/16"
      : state === "skip"
      ? "border-white/40 bg-white/10 text-gray-700 hover:bg-white/15"
      : "border-white/40 bg-white/10 text-gray-700 hover:bg-white/15"

  return (
    <button
      className={`${base} ${style}`}
      onClick={() => {
        const next: Record<Mark, Mark> = {
          empty: "yes",
          yes: "no",
          no: "skip",
          skip: "empty",
        }
        onChange(next[state ?? "empty"])
      }}
      aria-label="Toggle today"
      title="Mark today"
    >
      {label}
    </button>
  )
}

export function Rituals() {
  const rituals = useRitualsStore((s) => s.rituals)
  const setMark = useRitualsStore((s) => s.setMark)
  const today = localISODate()

  return (
    <Card className="p-4 bg-card border-border shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-accent" />
          <h3 className="text-base font-semibold text-card-foreground">Rituals</h3>
        </div>

        <Link
          href="/rituals"
          className="rounded-xl border border-white/30 px-3 py-1.5 text-sm text-muted-foreground hover:bg-white/10 transition-all"
        >
          Manage
        </Link>
      </div>

      <CardContent className="space-y-2 p-0">
        {rituals.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No rituals yet. Click <span className="font-medium">Manage</span> to add one.
          </div>
        ) : (
          rituals.map((r) => {
            const state = r.history[today] as Mark | undefined

            return (
              <div key={r.id} className={RITUAL_ROW}>
                <div className="min-w-0">
                  {/* Match EnergyCheck: darker text on light glass */}
                  <div className="truncate text-sm font-medium text-gray-800">{r.name}</div>

                  {r.tags?.length ? (
                    <div className="truncate text-xs text-gray-600">{r.tags.join(", ")}</div>
                  ) : null}
                </div>

                <TodayToggle state={state} onChange={(m) => setMark(r.id, today, m)} />
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
