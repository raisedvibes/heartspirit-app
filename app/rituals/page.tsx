// /app/rituals/page.tsx
"use client"

import type React from "react"
import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { Navigation } from "@/components/layout/navigation"
import { Button } from "@/components/ui/button"
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
const statusStyle: Record<Mark, string> = {
  empty: "bg-white/10 border border-white/20 hover:bg-white/20",
  yes: "bg-emerald-500/80 border border-emerald-300 text-white hover:bg-emerald-400/80",
  no: "bg-rose-500/80 border border-rose-300 text-white hover:bg-rose-400/80",
  skip: "bg-white/10 border border-white/30 text-white/70 hover:bg-white/20",
}

const GRID = "grid-cols-[minmax(0,2fr)_repeat(7,minmax(0,1fr))_auto_auto]"

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
    if (sameMonth) {
      return `${monthName(start)} ${day(start)}–${day(end)}, ${year(start)}`
    }
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
              className="rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:text-white shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Add Ritual Toggle */}
        <div className="mb-4">
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center rounded-xl bg-white/20 border border-white/30 
                       backdrop-blur-md text-white px-4 py-2 text-sm font-medium shadow-md 
                       hover:bg-white/30 transition"
          >
            + Add Ritual
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div
            className="mb-4 rounded-2xl p-4 
                       bg-white/20 backdrop-blur-md 
                       border border-white/30 shadow-md 
                       grid sm:grid-cols-3 gap-3"
          >
            <div className="sm:col-span-1">
              <label className="text-sm text-white/80">Name</label>
              <input
                className="mt-1 w-full rounded-xl 
                           bg-white/10 border border-white/25 
                           text-white placeholder:text-white/40 
                           px-3 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g., Morning Meditation"
              />
            </div>
            <div>
              <label className="text-sm text-white/80">Tags (comma-separated)</label>
              <input
                className="mt-1 w-full rounded-xl 
                           bg-white/10 border border-white/25 
                           text-white placeholder:text-white/40 
                           px-3 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
                value={addTags}
                onChange={(e) => setAddTags(e.target.value)}
                placeholder="breathwork, morning"
              />
            </div>
            <div>
              <label className="text-sm text-white/80">Reminder (optional)</label>
              <input
                type="time"
                className="mt-1 w-full rounded-xl 
                           bg-white/10 border border-white/25 
                           text-white placeholder:text-white/40 
                           px-3 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
                value={addReminder}
                onChange={(e) => setAddReminder(e.target.value)}
              />
            </div>

            {/* Add Form Actions */}
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-xl 
                           bg-white/10 text-white/80 
                           hover:bg-white/20 transition border border-white/25"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-xl 
                           bg-accent/80 text-white 
                           hover:bg-accent shadow-md transition"
                onClick={addRitual}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Week Navigator */}
        <div className="mb-3 flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center justify-center sm:justify-between">
            <div className="text-sm sm:text-base font-medium text-white/80">
              {formatWeekRange(weekISO)}
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-white border border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-md"
              onClick={() => setWeekAnchor(addDays(weekAnchor, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-white border border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-md"
              onClick={() => setWeekAnchor(new Date())}
            >
              Today
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={`text-white border border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-md ${
                nextDisabled ? "opacity-40 cursor-not-allowed hover:bg-white/10" : ""
              }`}
              onClick={() => setWeekAnchor(addDays(weekAnchor, 7))}
              disabled={nextDisabled}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop Header */}
        <div
          className="hidden sm:block rounded-2xl p-3 
                     bg-white/15 backdrop-blur-md 
                     border border-white/30 shadow-md"
        >
          <div className={`grid ${GRID} gap-2 items-center`}>
            {WEEK_LABELS_MON_START.map((d) => (
              <div key={d} className="text-center text-sm font-medium text-white/85">
                {d}
              </div>
            ))}
            <div className="text-right text-sm font-medium text-white/80">Record</div>
            <div className="w-12" />
          </div>
        </div>

        {/* List */}
        {rituals.length === 0 ? (
          <div className="text-center py-12">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full 
                         bg-white/20 border border-white/30 
                         backdrop-blur-md grid place-items-center text-white text-2xl"
            >
              +
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No rituals yet</h3>
            <p className="text-white/80 mb-5">Add your first ritual to begin tracking.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center rounded-xl 
                         bg-white/20 border border-white/30 
                         backdrop-blur-md text-white px-4 py-2 
                         text-sm font-medium shadow-md hover:bg-white/30 transition"
            >
              + Add Ritual
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {rituals.map((r) => {
              const streak = computeStreak(r.history, today)

              return (
                <div
                  key={r.id}
                  className="rounded-2xl p-4 
                             bg-white/15 backdrop-blur-md 
                             border border-white/30 shadow-md 
                             hover:bg-white/20 transition"
                >
                  {/* Desktop row */}
                  <div className={`hidden sm:grid ${GRID} items-center gap-2`} data-rit-row>
                    {/* Left: name + tags */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-white truncate">{r.name}</h3>
                        {r.tags.map((t, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg 
                                       bg-white/10 border border-white/25 
                                       text-white/85 text-xs"
                          >
                            {t}
                          </span>
                        ))}
                        {r.reminder && <span className="text-xs text-white/70">{r.reminder}</span>}
                      </div>

                      {/* Actions */}
                      <div className="mt-2 flex gap-2 flex-wrap">
                        <button
                          className="text-xs rounded-lg border border-white/30 bg-white/10 
                                     px-2 py-1 text-white/85 hover:bg-white/20 transition"
                          onClick={() => startEdit(r)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs rounded-lg px-2 py-1 
                                     text-rose-300 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          onClick={() => removeRitual(r.id)}
                        >
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
                                      focus:outline-none focus:ring-2 focus:ring-accent/70 
                                      focus:ring-offset-1 focus:ring-offset-transparent 
                                      ${statusStyle[s]} ${
                            disabled ? "opacity-40 cursor-not-allowed" : ""
                          }`}
                          title={iso}
                          aria-label={`${iso} status`}
                        >
                          {s === "yes" && <span className="font-bold text-xs">✓</span>}
                          {s === "no" && <span className="font-bold text-xs">✗</span>}
                          {s === "skip" && <span className="font-bold text-xs">−</span>}
                        </button>
                      )
                    })}

                    {/* Streak */}
                    <div className="text-right">
                      {streak >= 3 && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full 
                                     bg-amber-400/20 text-amber-200 text-xs font-semibold"
                        >
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
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg 
                                         bg-white/10 border border-white/25 
                                         text-white/85 text-xs"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        <div className="mt-1 text-xs text-white/70 flex items-center gap-2">
                          {r.reminder && <span>{r.reminder}</span>}
                          {streak >= 3 && <span className="opacity-80">• 🔥 {streak}</span>}
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          className="text-xs rounded-lg border border-white/30 bg-white/10 
                                     px-2 py-1 text-white/85 hover:bg-white/20 transition"
                          onClick={() => startEdit(r)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs rounded-lg px-2 py-1 
                                     text-rose-300 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          onClick={() => removeRitual(r.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Mobile day labels */}
                    <div className="grid grid-cols-7 gap-1">
                      {WEEK_LABELS_MON_START.map((d) => (
                        <div
                          key={d}
                          className="text-center text-[10px] leading-none font-medium text-white/70"
                        >
                          {d[0]}
                        </div>
                      ))}
                    </div>

                    {/* Mobile day cells */}
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
                                        focus:outline-none focus:ring-2 focus:ring-accent/70 
                                        focus:ring-offset-1 focus:ring-offset-transparent 
                                        ${statusStyle[s]} ${
                              disabled ? "opacity-40 cursor-not-allowed" : ""
                            }`}
                            title={iso}
                            aria-label={`${iso} status`}
                          >
                            {s === "yes" && <span className="font-bold text-[10px]">✓</span>}
                            {s === "no" && <span className="font-bold text-[10px]">✗</span>}
                            {s === "skip" && <span className="font-bold text-[10px]">−</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm grid place-items-center p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl 
                       bg-white/10 border border-white/30 
                       backdrop-blur-xl p-5 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="mb-3">
              <span
                className="inline-block rounded-md bg-white/10 px-2 py-0.5 
                           text-xs font-semibold tracking-wide text-white 
                           border border-white/30"
              >
                EDIT
              </span>
              <h2 className="mt-2 text-lg font-semibold text-white">Ritual</h2>
            </div>

            {/* Fields */}
            <label className="block text-sm text-white/80">Name</label>
            <input
              className="mt-1 w-full rounded-xl 
                         bg-white/10 border border-white/25 
                         text-white placeholder:text-white/40 
                         px-3 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent/70"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <div className="mt-3">
              <label className="block text-sm text-white/80">Tags (comma-separated)</label>
              <input
                className="mt-1 w-full rounded-xl 
                           bg-white/10 border border-white/25 
                           text-white placeholder:text-white/40 
                           px-3 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent/70"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
              />
            </div>

            <div className="mt-3">
              <label className="block text-sm text-white/80">Reminder (optional)</label>
              <input
                type="time"
                className="mt-1 w-full rounded-xl 
                           bg-white/10 border border-white/25 
                           text-white placeholder:text-white/40 
                           px-3 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent/70"
                value={editReminder}
                onChange={(e) => setEditReminder(e.target.value)}
              />
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-xl 
                           bg-white/10 text-white/85 
                           hover:bg-white/20 transition border border-white/25"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-xl 
                           bg-accent/80 text-white 
                           hover:bg-accent shadow-md transition"
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
        className="absolute z-50 rounded-xl 
                   bg-white/15 backdrop-blur-md 
                   border border-white/30 shadow-xl"
        style={{ left, top: y, width: w }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-2 left-6 h-0 w-0 border-x-8 border-x-transparent border-b-8 border-white/30" />
        <div className="absolute -top-[7px] left-[calc(1.5rem+1px)] h-0 w-0 border-x-7 border-x-transparent border-b-7 border-white/20" />

        <div className="flex items-stretch divide-x divide-white/20">
          <button
            onClick={() => onSelect("empty")}
            className="flex-1 px-3 py-2 text-sm text-white/85 hover:bg-white/15"
          >
            Erase
          </button>
          <button
            onClick={() => onSelect("yes")}
            className="flex-1 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-500/15"
          >
            Yes
          </button>
          <button
            onClick={() => onSelect("no")}
            className="flex-1 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/15"
          >
            No
          </button>
          <button
            onClick={() => onSelect("skip")}
            className="flex-1 px-3 py-2 text-sm text-white/80 hover:bg-white/12"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
