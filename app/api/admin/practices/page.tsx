"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, RefreshCcw } from "lucide-react"

import { Navigation } from "@/components/layout/navigation"
import { Button } from "@/components/ui/button"

const GLASS_BTN =
  "rounded-xl bg-black/25 border border-white/25 text-white backdrop-blur-md " +
  "shadow-[0_12px_40px_-26px_rgba(0,0,0,0.8)] hover:bg-black/35 hover:border-white/35 transition"

const GLASS_CARD =
  "rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md " +
  "shadow-[0_14px_60px_-35px_rgba(0,0,0,0.75)]"

type PracticeRow = {
  id: string
  title: string
  description: string | null
  category: string | null
  duration: number | null
  media_url: string | null
  slug: string | null
  tags: string[] | null
  short_summary: string | null
  audio_url: string | null
  cover_image: string | null
  updated_at: string | null
  created_at: string | null
  media_type: string | null
  thumbnail_url: string | null
}

export default function AdminPracticesPage() {
  const [practices, setPractices] = useState<PracticeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchList = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/practices/list", { cache: "no-store" })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to load practices")
      }

      setPractices(Array.isArray(json?.practices) ? json.practices : [])
    } catch (e: any) {
      setError(e?.message ?? "Failed to load practices")
      setPractices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  return (
    <div className="min-h-screen text-white">
      <Navigation />

      <main className="app-main max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="pt-4"
        >
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <Button variant="ghost" size="icon" className={GLASS_BTN}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>

              <div>
                <h1 className="text-2xl font-bold">Manage Practices</h1>
                <p className="text-sm text-white/70">
                  View and manage practices shown in the app.
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              className={GLASS_BTN}
              onClick={fetchList}
              disabled={loading}
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className={`p-4 ${GLASS_CARD}`}>
            {error ? (
              <div className="text-sm text-white/80 py-3">
                <span className="font-medium">Error:</span> {error}
              </div>
            ) : null}

            {loading ? (
              <div className="text-sm text-white/70 py-6">Loading practices…</div>
            ) : practices.length === 0 ? (
              <div className="text-sm text-white/70 py-6">No practices found.</div>
            ) : (
              <div className="grid gap-3">
                {practices.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl bg-black/15 border border-white/15 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-white">{p.title}</div>
                        <div className="text-sm text-white/70 mt-1">
                          {[p.category, p.duration ? `${p.duration} min` : null]
                            .filter(Boolean)
                            .join(" • ")}
                        </div>

                        {p.short_summary ? (
                          <div className="text-sm text-white/70 mt-2 line-clamp-2">
                            {p.short_summary}
                          </div>
                        ) : null}

                        {p.tags?.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {p.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-1 rounded-lg bg-black/20 border border-white/15 text-white/80"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}