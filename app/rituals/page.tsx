// /app/rituals/page.tsx
"use client"

import type React from "react"
import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { Navigation } from "@/components/layout/navigation"
import { Button } from "@/components/ui/button"
import TranslucentCard from "@/components/ui/translucent-card"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"

import {
  useRitualsStore,
  type Ritual,
  type Mark,
  getMonStartWeek,
  WEEK_LABELS_MON_START,
  todayISO,
  canEditDate,
  computeStreak,
} from "@/lib/rituals"

// ---------- styles ----------
// Higher contrast day-cells so icons/buttons never disappear on glass.
const statusStyle: Record<Mark, string> = {
  empty:
    "bg-black/25 border border-white/25 text-white/90 hover:bg-black/35 hover:border-white/35 shadow-[0_10px_30px_-22px_rgba(0,0,0,0.85)]",
  yes: "bg-emerald-500/85 border border-emerald-300/70 text-white hover:bg-emerald-400/85 shadow-[0_10px_30px_-22px_rgba(0,0,0,0.85)]",
  no: "bg-rose-500/85 border border-rose-300/70 text-white hover:bg-rose-400/85 shadow-[0_10px_30px_-22px_rgba(0,0,0,0.85)]",
  skip:
    "bg-black/20 border border-white/30 text-white/85 hover:bg-black/30 hover:border-white/40 shadow-[0_10px_30px_-22px_rgba(0,0,0,0.85)]",
}

const GRID = "grid-cols-[minmax(0,2fr)_repeat(7,minmax(0,1fr))_auto_auto]"

// Unified “on-glass” action button style (Edit/Delete/etc) just for this page.
const ACTION_BTN =
  "text-xs rounded-lg border border-white/28 bg-black/20 px-2 py-1 text-white/90 backdrop-blur-sm " +
  "shadow-[0_10px_30px_-22px_rgba(0,0,0,0.8)] hover:bg-black/30 hover:border-white/40 transition"

// Delete uses same base but red-tinted hover for clarity.
const DELETE_BTN =
  "text-xs rounded-lg border border-rose-300/25 bg-rose-500/10 px-2 py-1 text-rose-200 backdrop-blur-sm " +
  "shadow-[0_10px_30px_-22px_rgba(0,0,0,0.8)] hover:bg-rose-500/18 hover:border-rose-300/45 hover:text-rose-100 transition"

// Tag pill slightly stronger so it’s always readable on glass.
const TAG_PILL =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/20 border border-white/25 text-white/90 text-xs backdrop-blur-sm"

// ---------- helpers ----------
const parseTags = (input?: string) =>
  (input ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)

function addDays(base: Date, n: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

function formatWeekRange(weekDays: string[]) {
  if (weekDays.length < 7) return ""
  const start = new Date(weekDays[0] + "T00:00:00")
  const end = new Date(weekDays[6] + "T00:00:00")

  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()

  const monthName = (d: Date) => d.toLocaleDateString(undefined, { month: "long" })
  const shortMonth = (d: Date) => d.toLocaleDateString(undefined, { month: "short" })
  const day = (d: Date) => d.getDate()
  const year = (d: Date) => d.getFullYear()

  if (sameYear) {
    if (sameMonth) return `${monthName(start)} ${day(start)}–${day(end)}, ${year(start)}`
    return `${shortMonth(start)} ${day(start)} – ${shortMonth(end)} ${day(end)}, ${year(start)}`
  }
  return `${shortMonth(start)} ${day(start)}, ${year(start)} – ${shortMonth(end)} ${day(end)}, ${year(end)}`
}

// ---------- PAGE ----------
export default function RitualsPage() {
  const rituals = useRitualsStore((s) => s.rituals)
  const upsert = useRitualsStore((s) => s.upsert)
  const removeRitual = useRitualsStore((s) => s.remove)
  const setMark = useRitualsStore((s) => s.setMark)

  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState("")
  const [addTags, setAddTags] = useState("")
  const [addReminder, setAddReminder] = useState("")

  const [editing, setEditing] = useState<Ritual | null>(null)
  const [editName, setEditName] = useState("")
  const [editTags, setEditTags] = useState("")
  const [editReminder, setEditReminder] = useState("")

  const [ctx, setCtx] = useState<{
    open: boolean
    ritualId: string | null
    dayKey: string | null
    x: number
    y: number
    w?: number
  }>({ open: false, ritualId: null, dayKey: null, x: 0, y: 0, w: 0 })

  const [weekAnchor, setWeekAnchor] = useState<Date>(new Date())

  const weekISO = useMemo(() => getMonStartWeek(weekAnchor), [weekAnchor])
  const today = useMemo(() => todayISO(), [])
  const currentWeekStart = useMemo(() => getMonStartWeek(new Date())[0], [])
  const nextWeekStart = useMemo(() => getMonStartWeek(addDays(weekAnchor, 7))[0], [weekAnchor])
  const nextDisabled = nextWeekStart > currentWeekStart

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCtx({ open: false, ritualId: null, dayKey: null, x: 0, y: 0, w: 0 })
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const openMenuForDay = (e: React.MouseEvent<HTMLButtonElement>, ritualId: string, dayKey: string) => {
    if (!canEditDate(dayKey)) return

    const btn = e.currentTarget
    const row = btn.closest("[data-rit-row]") as HTMLElement | null

    const btnRect = btn.getBoundingClientRect()
    let left = btnRect.left - 120
    let width = 240
    let top = btnRect.bottom + 8

    if (row) {
      const days = Array.from(row.querySelectorAll<HTMLButtonElement>("[data-day-idx]"))
      const first = days[0]?.getBoundingClientRect()
      const last = days[days.length - 1]?.getBoundingClientRect()
      if (first && last) {
        left = first.left
        width = Math.max(
          220,
          Math.min((typeof window !== "undefined" ? window.innerWidth : 390) - 16, last.right - first.left),
        )
        top = last.bottom + 8
      }
    }
    setCtx({ open: true, ritualId, dayKey, x: left, y: top, w: width })
  }

  const setDayStatus = (status: Mark) => {
    if (!ctx.ritualId || !ctx.dayKey) return
    if (!canEditDate(ctx.dayKey)) return
    setMark(ctx.ritualId, ctx.dayKey, status)
    setCtx({ open: false, ritualId: null, dayKey: null, x: 0, y: 0, w: 0 })
  }

  const addRitual = () => {
    const name = addName.trim()
    if (!name) return
    const now = new Date().toISOString()
    const r: Ritual = {
      id: crypto.randomUUID(),
      name,
      tags: parseTags(addTags),
      reminder: addReminder || undefined,
      history: {},
      createdAt: now,
      updatedAt: now,
    }
    upsert(r)
    setAddName("")
    setAddTags("")
    setAddReminder("")
    setShowAdd(false)
  }

  const startEdit = (r: Ritual) => {
    setEditing(r)
    setEditName(r.name)
    setEditTags(r.tags.join(", "))
    setEditReminder(r.reminder ?? "")
  }

  const saveEdit = () => {
    if (!editing) return
    const name = editName.trim()
    if (!name) return
    const now = new Date().toISOString()
    upsert({
      ...editing,
      name,
      tags: parseTags(editTags),
      reminder: editReminder || undefined,
      updatedAt: now,
    })
    setEditing(null)
  }

  return (
    <div className="min-h-screen text-white">
      <Navigation />

      <main className="app-main max-w-6xl mx-auto px-4 pb-10 md:pb-16 lg:pb-24">
        <div className="flex items-start justify-between mb-6 w-full pt-4">
          <Link href="/dashboard" className="shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl bg-black/25 border border-white/25 text-white hover:bg-black/35 hover:text-white shadow-[0_12px_40px_-26px_rgba(0,0,0,0.8)] backdrop-blur-md"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Add Ritual Toggle */}
        <div className="mb-4">
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center rounded-xl bg-black/25 border border-white/25 
                       backdrop-blur-md text-white px-4 py-2 text-sm font-medium 
                       shadow-[0_12px_40px_-26px_rgba(0,0,0,0.8)]
                       hover:bg-black/35 hover:border-white/35 transition"
          >
            + Add Ritual
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <TranslucentCard className="mb-4 p-4 grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-sm text-white/85">Name</label>
              <input
                className="mt-1 w-full rounded-xl 
                           bg-black/20 border border-white/25 
                           text-white placeholder:text-white/45 
                           px-3 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent/70"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g., Morning Meditation"
              />
            </div>
            <div>
              <label className="text-sm text-white/85">Tags (comma-separated)</label>
              <input
                className="mt-1 w-full rounded-xl 
                           bg-black/20 border border-white/25 
                           text-white placeholder:text-white/45 
                           px-3 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent/70"
                value={addTags}
                onChange={(e) => setAddTags(e.target.value)}
                placeholder="breathwork, morning"
              />
            </div>
            <div>
              <label className="text-sm text-white/85">Reminder (optional)</label>
              <input
                type="time"
                className="mt-1 w-full rounded-xl 
                           bg-black/20 border border-white/25 
                           text-white placeholder:text-white/45 
                           px-3 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent/70"
                value={addReminder}
                onChange={(e) => setAddReminder(e.target.value)}
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-xl 
                           bg-black/20 text-white/90 
                           hover:bg-black/30 transition border border-white/25 backdrop-blur-sm"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-xl 
                           bg-accent/85 text-white 
                           hover:bg-accent shadow-[0_14px_50px_-28px_rgba(0,0,0,0.85)] transition"
                onClick={addRitual}
              >
                Add
              </button>
            </div>
          </TranslucentCard>
        )}

        {/* Week Navigator */}
        <TranslucentCard className="mb-4 p-3">
          {/* Mobile */}
          <div className="sm:hidden space-y-2">
            <div className="text-center text-sm font-medium text-white/85">{formatWeekRange(weekISO)}</div>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-white border border-white/28 bg-black/20 hover:bg-black/30 backdrop-blur-md"
                onClick={() => setWeekAnchor(addDays(weekAnchor, -7))}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-white border border-white/28 bg-black/20 hover:bg-black/30 backdrop-blur-md"
                onClick={() => setWeekAnchor(new Date())}
              >
                Today
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={`text-white border border-white/28 bg-black/20 hover:bg-black/30 backdrop-blur-md ${
                  nextDisabled ? "opacity-40 cursor-not-allowed hover:bg-black/20" : ""
                }`}
                onClick={() => setWeekAnchor(addDays(weekAnchor, 7))}
                disabled={nextDisabled}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden sm:grid grid-cols-3 items-center gap-2">
            <div className="justify-self-start">
              <Button
                variant="outline"
                size="sm"
                className="text-white border border-white/28 bg-black/20 hover:bg-black/30 backdrop-blur-md"
                onClick={() => setWeekAnchor(addDays(weekAnchor, -7))}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </div>

            <div className="text-center text-sm sm:text-base font-medium text-white/85">{formatWeekRange(weekISO)}</div>

            <div className="justify-self-end flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-white border border-white/28 bg-black/20 hover:bg-black/30 backdrop-blur-md"
                onClick={() => setWeekAnchor(new Date())}
              >
                Today
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={`text-white border border-white/28 bg-black/20 hover:bg-black/30 backdrop-blur-md ${
                  nextDisabled ? "opacity-40 cursor-not-allowed hover:bg-black/20" : ""
                }`}
                onClick={() => setWeekAnchor(addDays(weekAnchor, 7))}
                disabled={nextDisabled}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TranslucentCard>

        {/* Desktop Header */}
        <TranslucentCard className="hidden sm:block p-3">
          <div className={`grid ${GRID} gap-2 items-center`}>
            {WEEK_LABELS_MON_START.map((d) => (
              <div key={d} className="text-center text-sm font-medium text-white/90">
                {d}
              </div>
            ))}
            <div className="text-right text-sm font-medium text-white/85">Record</div>
            <div className="w-12" />
          </div>
        </TranslucentCard>

        {/* List */}
        {rituals.length === 0 ? (
          <div className="mt-6">
            <TranslucentCard className="text-center py-10">
              <h3 className="text-lg font-medium text-white mb-1">No rituals yet</h3>
              <p className="text-white/85 mb-5">Add your first ritual to begin tracking.</p>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center rounded-xl bg-black/25 border border-white/25 backdrop-blur-md text-white px-4 py-2 text-sm font-medium shadow-[0_12px_40px_-26px_rgba(0,0,0,0.8)] hover:bg-black/35 hover:border-white/35 transition"
              >
                + Add Ritual
              </button>
            </TranslucentCard>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {rituals.map((r) => {
              const streak = computeStreak(r.history, today)

              return (
                <TranslucentCard key={r.id} className="p-4">
                  {/* Desktop row */}
                  <div className={`hidden sm:grid ${GRID} items-center gap-2`} data-rit-row>
                    {/* Left: name + tags */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-white truncate">{r.name}</h3>
                        {r.tags.map((t, i) => (
                          <span key={i} className={TAG_PILL}>
                            {t}
                          </span>
                        ))}
                        {r.reminder && <span className="text-xs text-white/80">{r.reminder}</span>}
                      </div>

                      <div className="mt-2 flex gap-2 flex-wrap">
                        <button className={ACTION_BTN} onClick={() => startEdit(r)}>
                          Edit
                        </button>
                        <button className={DELETE_BTN} onClick={() => removeRitual(r.id)}>
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* 7 day cells */}
                    {weekISO.map((iso, idx) => {
                      const s: Mark = r.history[iso] ?? "empty"
                      const disabled = !canEditDate(iso)
                      return (
                        <button
                          key={iso}
                          data-day-idx={idx}
                          onClick={(e) => (disabled ? undefined : openMenuForDay(e, r.id, iso))}
                          className={`mx-auto w-8 h-8 rounded-xl transition 
                                      focus:outline-none focus:ring-2 focus:ring-accent/75 
                                      focus:ring-offset-1 focus:ring-offset-transparent 
                                      ${statusStyle[s]} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                          title={iso}
                          aria-label={`${iso} status`}
                        >
                          {s === "yes" && <span className="font-bold text-xs drop-shadow-sm">✓</span>}
                          {s === "no" && <span className="font-bold text-xs drop-shadow-sm">✗</span>}
                          {s === "skip" && <span className="font-bold text-xs drop-shadow-sm">−</span>}
                        </button>
                      )
                    })}

                    {/* Streak */}
                    <div className="text-right">
                      {streak >= 3 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-400/20 text-amber-200 text-xs font-semibold border border-amber-200/20">
                          🔥 {streak}
                        </span>
                      )}
                    </div>
                    <div className="w-12" />
                  </div>

                  {/* Mobile layout */}
                  <div className="sm:hidden space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-white truncate">{r.name}</h3>
                          {r.tags.map((t, i) => (
                            <span key={i} className={TAG_PILL}>
                              {t}
                            </span>
                          ))}
                        </div>

                        <div className="mt-1 text-xs text-white/80 flex items-center gap-2">
                          {r.reminder && <span>{r.reminder}</span>}
                          {streak >= 3 && <span className="opacity-90">• 🔥 {streak}</span>}
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button className={ACTION_BTN} onClick={() => startEdit(r)}>
                          Edit
                        </button>
                        <button className={DELETE_BTN} onClick={() => removeRitual(r.id)}>
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {WEEK_LABELS_MON_START.map((d) => (
                        <div key={d} className="text-center text-[10px] leading-none font-medium text-white/80">
                          {d[0]}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1" data-rit-row>
                      {weekISO.map((iso, idx) => {
                        const s: Mark = r.history[iso] ?? "empty"
                        const disabled = !canEditDate(iso)
                        return (
                          <button
                            key={iso}
                            data-day-idx={idx}
                            onClick={(e) => (disabled ? undefined : openMenuForDay(e, r.id, iso))}
                            className={`w-7 h-7 rounded-xl transition 
                                        focus:outline-none focus:ring-2 focus:ring-accent/75 
                                        focus:ring-offset-1 focus:ring-offset-transparent 
                                        ${statusStyle[s]} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                            title={iso}
                            aria-label={`${iso} status`}
                          >
                            {s === "yes" && <span className="font-bold text-[10px] drop-shadow-sm">✓</span>}
                            {s === "no" && <span className="font-bold text-[10px] drop-shadow-sm">✗</span>}
                            {s === "skip" && <span className="font-bold text-[10px] drop-shadow-sm">−</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </TranslucentCard>
              )
            })}
          </div>
        )}
      </main>

      {/* Slim row toolbar */}
      {ctx.open && (
        <DayToolbar
          x={ctx.x}
          y={ctx.y}
          w={ctx.w ?? 280}
          onClose={() => setCtx({ open: false, ritualId: null, dayKey: null, x: 0, y: 0, w: 0 })}
          onSelect={(m) => setDayStatus(m)}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <div
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm grid place-items-center p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-black/25 border border-white/25 backdrop-blur-xl p-5 shadow-[0_24px_90px_-50px_rgba(0,0,0,0.95)] text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3">
              <span className="inline-block rounded-md bg-black/20 px-2 py-0.5 text-xs font-semibold tracking-wide text-white border border-white/25">
                EDIT
              </span>
              <h2 className="mt-2 text-lg font-semibold text-white">Ritual</h2>
            </div>

            <label className="block text-sm text-white/85">Name</label>
            <input
              className="mt-1 w-full rounded-xl bg-black/20 border border-white/25 text-white placeholder:text-white/45 px-3 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent/75"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <div className="mt-3">
              <label className="block text-sm text-white/85">Tags (comma-separated)</label>
              <input
                className="mt-1 w-full rounded-xl bg-black/20 border border-white/25 text-white placeholder:text-white/45 px-3 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent/75"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
              />
            </div>

            <div className="mt-3">
              <label className="block text-sm text-white/85">Reminder (optional)</label>
              <input
                type="time"
                className="mt-1 w-full rounded-xl bg-black/20 border border-white/25 text-white placeholder:text-white/45 px-3 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent/75"
                value={editReminder}
                onChange={(e) => setEditReminder(e.target.value)}
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-xl bg-black/20 text-white/95 hover:bg-black/30 transition border border-white/25 backdrop-blur-sm"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-accent/85 text-white hover:bg-accent shadow-[0_14px_50px_-28px_rgba(0,0,0,0.85)] transition"
                onClick={saveEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Slim toolbar */
function DayToolbar({
  x,
  y,
  w,
  onClose,
  onSelect,
}: {
  x: number
  y: number
  w: number
  onClose: () => void
  onSelect: (m: "empty" | "yes" | "no" | "skip") => void
}) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 390
  const left = Math.max(8, Math.min(x, vw - w - 8))

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute z-50 rounded-xl bg-black/35 backdrop-blur-xl border border-white/22 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.95)]"
        style={{ left, top: y, width: w }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-2 left-6 h-0 w-0 border-x-8 border-x-transparent border-b-8 border-white/25" />
        <div className="absolute -top-[7px] left-[calc(1.5rem+1px)] h-0 w-0 border-x-7 border-x-transparent border-b-7 border-black/35" />

        <div className="grid grid-cols-4 divide-x divide-white/15">
          <button onClick={() => onSelect("empty")} className="px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition">
            Erase
          </button>
          <button onClick={() => onSelect("yes")} className="px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-500/15 transition">
            Yes
          </button>
          <button onClick={() => onSelect("no")} className="px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/15 transition">
            No
          </button>
          <button onClick={() => onSelect("skip")} className="px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition">
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
