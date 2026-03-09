"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, FileAudio, FileVideo, Image as ImageIcon, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Practice {
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
  created_at: string
  media_type: string | null
  thumbnail_url: string | null
}

export default function AdminPracticesPage() {
  const [practices, setPractices] = useState<Practice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchPractices() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/practices/list", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch practices")
      }
      setPractices(data.practices ?? [])
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPractices()
  }, [])

  function formatDuration(seconds: number | null) {
    if (!seconds) return "-"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  function getMediaIcon(practice: Practice) {
    if (practice.media_type === "video" || practice.media_url) {
      return <FileVideo className="size-4 text-white/60" />
    }
    if (practice.audio_url) {
      return <FileAudio className="size-4 text-white/60" />
    }
    return null
  }

  return (
    <main className="app-main px-4 pb-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="glass-btn flex size-9 items-center justify-center"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white">Practices</h1>
              <p className="text-sm text-white/60">
                {practices.length} total practices
              </p>
            </div>
          </div>
          <button
            onClick={fetchPractices}
            disabled={loading}
            className="glass-btn flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="glass-card mb-6 border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !practices.length && (
          <div className="glass-card p-8 text-center text-white/60">
            <RefreshCw className="mx-auto mb-3 size-6 animate-spin" />
            Loading practices...
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && practices.length === 0 && (
          <div className="glass-card p-8 text-center text-white/60">
            No practices found.
          </div>
        )}

        {/* Practices List */}
        {practices.length > 0 && (
          <div className="space-y-3">
            {practices.map((practice) => (
              <div
                key={practice.id}
                className="glass-card flex items-start gap-4 p-4"
              >
                {/* Thumbnail */}
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
                  {practice.cover_image || practice.thumbnail_url ? (
                    <img
                      src={practice.cover_image || practice.thumbnail_url || ""}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <ImageIcon className="size-6 text-white/20" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="truncate font-medium text-white">
                      {practice.title}
                    </h3>
                    <div className="flex shrink-0 items-center gap-2">
                      {getMediaIcon(practice)}
                      {practice.duration && (
                        <span className="flex items-center gap-1 text-xs text-white/50">
                          <Clock className="size-3" />
                          {formatDuration(practice.duration)}
                        </span>
                      )}
                    </div>
                  </div>

                  {practice.short_summary && (
                    <p className="mb-2 line-clamp-1 text-sm text-white/60">
                      {practice.short_summary}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {practice.category && (
                      <Badge variant="outline" className="text-xs text-white/70 border-white/20">
                        {practice.category}
                      </Badge>
                    )}
                    {practice.tags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="tag" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {practice.tags && practice.tags.length > 3 && (
                      <span className="text-xs text-white/40">
                        +{practice.tags.length - 3} more
                      </span>
                    )}
                    <span className="ml-auto text-xs text-white/40">
                      {formatDate(practice.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
