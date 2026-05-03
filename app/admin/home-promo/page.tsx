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

type HomePromo = {
  id: string
  title: string
  body: string
  button_label: string | null
  url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export default function AdminHomePromoPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [buttonLabel, setButtonLabel] = useState("")
  const [url, setUrl] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [current, setCurrent] = useState<HomePromo | null>(null)

  const fetchCurrent = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/admin/home-promo/get", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to load home promo")

      const item = (json?.homePromo ?? null) as HomePromo | null
      setCurrent(item)
      setTitle(item?.title?.trim() ?? "")
      setBody(item?.body ?? "")
      setButtonLabel(item?.button_label?.trim() ?? "")
      setUrl(item?.url?.trim() ?? "")
      setIsActive(Boolean(item?.is_active))
    } catch (e: any) {
      setError(e?.message ?? "Failed to load home promo")
      setCurrent(null)
      setIsActive(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrent()
  }, [])

  const save = async () => {
    if (isActive && (!title.trim() || !body.trim())) {
      setError("Title and body are required when the promo is active.")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/admin/home-promo/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          button_label: buttonLabel.trim() || null,
          url: url.trim() || null,
          is_active: isActive,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to save home promo")

      setSuccess(isActive ? "Home promo published." : "Home promo turned off.")
      await fetchCurrent()
    } catch (e: any) {
      setError(e?.message ?? "Failed to save home promo")
    } finally {
      setSaving(false)
    }
  }

  const previewButton =
    buttonLabel.trim() || (url.trim() ? "Open link" : "")

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
            <h1 className="text-2xl font-semibold tracking-tight">Home promo</h1>
            <p className="text-sm text-white/70">
              Optional card at the bottom of the mobile Home tab (below Circles). Content is not
              hard-coded in the app.
            </p>
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

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-white/30"
            />
            <span className="text-sm font-medium text-white/90">Show promo on Home (active)</span>
          </label>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-white/75">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none focus:border-white/40"
              placeholder="Offering title"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-white/75">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-3 text-white outline-none focus:border-white/40"
              placeholder="Short description for the mobile card…"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-white/75">
              Button label (optional)
            </label>
            <input
              type="text"
              value={buttonLabel}
              onChange={(e) => setButtonLabel(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none focus:border-white/40"
              placeholder="e.g. View offering"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-white/75">
              URL (optional, https only)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-white outline-none focus:border-white/40"
              placeholder="https://…"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-xs text-white/60">
              Active version:{" "}
              {current?.is_active && current?.created_at
                ? new Date(current.created_at).toLocaleString()
                : "none"}
            </p>
            <button
              type="button"
              onClick={save}
              disabled={saving || loading}
              className={`inline-flex items-center gap-2 px-4 py-2 ${GLASS_BTN}`}
            >
              <Save className="size-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </section>

        <section className={`${GLASS_CARD} p-5 sm:p-6 space-y-3`}>
          <h2 className="text-sm font-semibold text-white/90">Preview</h2>
          <p className="text-xs text-white/55">
            Approximate mobile card layout (button does not open links here).
          </p>
          <div className="rounded-xl border border-white/15 bg-black/25 p-4 space-y-2 max-w-md">
            <p className="text-base font-semibold text-white">{title.trim() || "Title"}</p>
            <p className="text-sm text-white/75 whitespace-pre-wrap">{body.trim() || "Body text"}</p>
            {url.trim() ? (
              <span className="inline-block mt-2 rounded-lg bg-white/15 border border-white/20 px-3 py-2 text-sm text-white/90">
                {previewButton || "Open link"}
              </span>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}
