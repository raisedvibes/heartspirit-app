"use client"

import Link from "next/link"
import { Flame } from "lucide-react"
import { useRitualsStore, type Mark, localISODate } from "@/lib/rituals"

const RITUAL_ROW =
  "flex items-center justify-between gap-3 rounded-lg " +
  "border-2 border-white/40 bg-white/10 " +
  "px-3 py-2 backdrop-blur-sm " +
  "hover:border-accent hover:bg-accent/20 transition-all duration-200"

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
    "text-white backdrop-blur-sm " +
    "focus:outline-none focus:ring-2 focus:ring-accent/60 focus:ring-offset-1 focus:ring-offset-transparent"

  const style =
    state === "yes"
      ? "border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/20"
      : state === "no"
      ? "border-rose-500/40 bg-rose-500/12 hover:bg-rose-500/16"
      : "border-white/40 bg-white/10 hover:bg-white/15"

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
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-accent" />
          <h3 className="text-base font-semibold text-white">Rituals</h3>
        </div>

        <Link
          href="/rituals"
          className="rounded-xl border border-white/30 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10 hover:text-white transition-all"
        >
          Manage
        </Link>
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {rituals.length === 0 ? (
          <div className="text-sm text-white/80">
            No rituals yet. Click <span className="font-medium text-white">Manage</span> to add one.
          </div>
        ) : (
          rituals.map((r) => {
            const state = r.history[today] as Mark | undefined

            return (
              <div key={r.id} className={RITUAL_ROW}>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">{r.name}</div>

                  {r.tags?.length ? (
                    <div className="truncate text-xs text-white/75">{r.tags.join(", ")}</div>
                  ) : null}
                </div>

                <TodayToggle state={state} onChange={(m) => setMark(r.id, today, m)} />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
