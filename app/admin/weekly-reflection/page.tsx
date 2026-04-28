"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, RefreshCcw, Save } from "lucide-react"
import { Navigation } from "@/components/layout/navigation"

const GLASS_BTN =
  "rounded-xl bg-black/25 border border-white/25 text-white backdrop-blur-md " +
  "shadow-[0_12px_40px_-26px_rgba(0,0,0,0.8)] hover:bg-black/35 hover:border-white/35 transition"

const GLASS_CARD =
  "rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md " +
  "shadow-[0_14px_60px_-35px_rgba(0,0,0,0.75)]"

type WeeklyReflection = {
  id: string
  title: string
  reflection: string
  week_start: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminWeeklyReflectionPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [title, setTitle] = useState("This week")
  const [reflection, setReflection] = useState("")
  const [weekStart, setWeekStart] = useState("")
  const [current, setCurrent] = useState<WeeklyReflection | null>(null)

  const fetchCurrent = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/admin/weekly-reflection/get", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to load weekly reflection")

      const item = (json?.weeklyReflection ?? null) as WeeklyReflection | null
      setCurrent(item)
      setTitle(item?.title?.trim() || "This week")
      setReflection(item?.reflection ?? "")
      setWeekStart(item?.week_start ?? "")
    } catch (e: any) {
      setError(e?.message ?? "Failed to load weekly reflection")
      setCurrent(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrent()
  }, [])

  const save = async () => {
    if (!reflection.trim()) {
      setError("Reflection is required.")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/admin/weekly-reflection/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "This week",
          reflection: reflection.trim(),
          week_start: weekStart.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to save weekly reflection")

      setSuccess("Weekly reflection updated.")
      await fetchCurrent()
    } catch (e: any) {
      setError(e?.message ?? "Failed to save weekly reflection")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen text-white">
      <Navigation />

      <main className="app-main max-w-4xl mx-auto px-4 pb-16 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Link href="/admin" className={`inline-flex items-center gap-2 px-3 py-2 ${GLASS_BTN}`}>
              <ArrowLeft className="size-4" />
              Back to admin
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">Weekly Reflection</h1>
            <p className="text-sm text-white/70">This content appears only on the mobile Home tab.</p>
          </div>

          <button
            type="button"
            onClick={fetchCurrent}
            className={`inline-flex items-center gap-2 px-3 py-2 ${GLASS_BTN}`}
            disabled={loading || saving}
          >
            <RefreshCcw className="size-4" />
            Refresh
          </button>
        </div>

        <section className={`${GLASS_CARD} p-5 sm:p-6 space-y-4`}>
          {error && <p className="text-sm text-red-200">{error}</p>}
          {success && <p className="text-sm text-emerald-200">{success}</p>}

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-white/75">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none focus:border-white/40"
              placeholder="This week"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-white/75">Week start (optional)</label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none focus:border-white/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-white/75">Reflection</label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={7}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-3 text-white outline-none focus:border-white/40"
              placeholder="Write this week’s reflection…"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-xs text-white/60">
              Active version: {current ? new Date(current.created_at).toLocaleString() : "none yet"}
            </p>
            <button
              type="button"
              onClick={save}
              disabled={saving || loading}
              className={`inline-flex items-center gap-2 px-4 py-2 ${GLASS_BTN}`}
            >
              <Save className="size-4" />
              {saving ? "Saving..." : "Save reflection"}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
