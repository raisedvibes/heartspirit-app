"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  Clock,
  FileAudio,
  FileVideo,
  Image as ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react"
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
  instruction_bullets: string[] | null
  mantra: string | null
  timer_minutes: number | null
  has_chime: boolean
}

type Draft = {
  title: string
  description: string
  category: string
  duration: string
  media_url: string
  slug: string
  tags: string
  short_summary: string
  audio_url: string
  cover_image: string
  media_type: string
  thumbnail_url: string
  instruction_bullets: string
  mantra: string
  timer_minutes: string
  has_chime: boolean
}

const emptyDraft: Draft = {
  title: "",
  description: "",
  category: "",
  duration: "",
  media_url: "",
  slug: "",
  tags: "",
  short_summary: "",
  audio_url: "",
  cover_image: "",
  media_type: "",
  thumbnail_url: "",
  instruction_bullets: "",
  mantra: "",
  timer_minutes: "",
  has_chime: true,
}

function parseTags(raw: string) {
  const cleaned = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  return cleaned.length ? cleaned : null
}

function parseBullets(raw: string) {
  const cleaned = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
  return cleaned.length ? cleaned : null
}

function toNumberOrNull(value: string) {
  if (!value.trim()) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function draftFromPractice(practice: Practice): Draft {
  return {
    title: practice.title ?? "",
    description: practice.description ?? "",
    category: practice.category ?? "",
    duration: practice.duration?.toString() ?? "",
    media_url: practice.media_url ?? "",
    slug: practice.slug ?? "",
    tags: (practice.tags ?? []).join(", "),
    short_summary: practice.short_summary ?? "",
    audio_url: practice.audio_url ?? "",
    cover_image: practice.cover_image ?? "",
    media_type: practice.media_type ?? "",
    thumbnail_url: practice.thumbnail_url ?? "",
    instruction_bullets: (practice.instruction_bullets ?? []).join("\n"),
    mantra: practice.mantra ?? "",
    timer_minutes: practice.timer_minutes?.toString() ?? "",
    has_chime: practice.has_chime ?? true,
  }
}

function formatDuration(minutes: number | null) {
  if (!minutes) return "-"
  return `${minutes} min`
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

export default function AdminPracticesPage() {
  const [practices, setPractices] = useState<Practice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [createDraft, setCreateDraft] = useState<Draft>(emptyDraft)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Draft | null>(null)

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
      setPractices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPractices()
  }, [])

  const totalCount = useMemo(() => practices.length, [practices])

  function startEdit(practice: Practice) {
    setEditingId(practice.id)
    setEditDraft(draftFromPractice(practice))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft(null)
  }

  async function createPractice() {
    if (!createDraft.title.trim()) {
      setError("Title is required.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/practices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createDraft.title.trim(),
          description: createDraft.description.trim() || null,
          category: createDraft.category.trim() || null,
          duration: toNumberOrNull(createDraft.duration),
          media_url: createDraft.media_url.trim() || null,
          slug: createDraft.slug.trim() || null,
          tags: parseTags(createDraft.tags),
          short_summary: createDraft.short_summary.trim() || null,
          audio_url: createDraft.audio_url.trim() || null,
          cover_image: createDraft.cover_image.trim() || null,
          media_type: createDraft.media_type.trim() || null,
          thumbnail_url: createDraft.thumbnail_url.trim() || null,
          instruction_bullets: parseBullets(createDraft.instruction_bullets),
          mantra: createDraft.mantra.trim() || null,
          timer_minutes: toNumberOrNull(createDraft.timer_minutes),
          has_chime: createDraft.has_chime,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to create practice")

      setCreateDraft(emptyDraft)
      setCreating(false)
      await fetchPractices()
    } catch (err: any) {
      setError(err.message || "Failed to create practice")
    } finally {
      setSaving(false)
    }
  }

  async function updatePractice(id: string) {
    if (!editDraft) return
    if (!editDraft.title.trim()) {
      setError("Title is required.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/practices/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: editDraft.title.trim(),
          description: editDraft.description.trim() || null,
          category: editDraft.category.trim() || null,
          duration: toNumberOrNull(editDraft.duration),
          media_url: editDraft.media_url.trim() || null,
          slug: editDraft.slug.trim() || null,
          tags: parseTags(editDraft.tags),
          short_summary: editDraft.short_summary.trim() || null,
          audio_url: editDraft.audio_url.trim() || null,
          cover_image: editDraft.cover_image.trim() || null,
          media_type: editDraft.media_type.trim() || null,
          thumbnail_url: editDraft.thumbnail_url.trim() || null,
          instruction_bullets: parseBullets(editDraft.instruction_bullets),
          mantra: editDraft.mantra.trim() || null,
          timer_minutes: toNumberOrNull(editDraft.timer_minutes),
          has_chime: editDraft.has_chime,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to update practice")

      cancelEdit()
      await fetchPractices()
    } catch (err: any) {
      setError(err.message || "Failed to update practice")
    } finally {
      setSaving(false)
    }
  }

  async function deletePractice(practice: Practice) {
    const ok = confirm(`Delete practice "${practice.title}"? This cannot be undone.`)
    if (!ok) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/practices/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: practice.id }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to delete practice")

      await fetchPractices()
    } catch (err: any) {
      setError(err.message || "Failed to delete practice")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="app-main px-4 pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="glass-btn flex size-9 items-center justify-center">
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white">Practices</h1>
              <p className="text-sm text-white/60">{totalCount} total practices</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchPractices}
              disabled={loading || saving}
              className="glass-btn flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <button
              onClick={() => setCreating((v) => !v)}
              disabled={saving}
              className="glass-btn flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
            >
              {creating ? <X className="size-4" /> : <Plus className="size-4" />}
              {creating ? "Close" : "New Practice"}
            </button>
          </div>
        </div>

        {error && (
          <div className="glass-card mb-6 border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {creating && (
          <div className="glass-card mb-6 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">Create Practice</h2>
            </div>

            <PracticeForm draft={createDraft} setDraft={setCreateDraft} />

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={createPractice}
                disabled={saving}
                className="glass-btn flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
              >
                <Check className="size-4" />
                {saving ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        )}

        {loading && !practices.length && (
          <div className="glass-card p-8 text-center text-white/60">
            <RefreshCw className="mx-auto mb-3 size-6 animate-spin" />
            Loading practices...
          </div>
        )}

        {!loading && !error && practices.length === 0 && (
          <div className="glass-card p-8 text-center text-white/60">
            No practices found.
          </div>
        )}

        {practices.length > 0 && (
          <div className="space-y-3">
            {practices.map((practice) => {
              const isEditing = editingId === practice.id

              return (
                <div key={practice.id} className="glass-card p-4">
                  {!isEditing ? (
                    <div className="flex items-start gap-4">
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

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-medium text-white">{practice.title}</h3>
                            {practice.short_summary && (
                              <p className="mt-1 line-clamp-2 text-sm text-white/60">
                                {practice.short_summary}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {getMediaIcon(practice)}
                            {practice.duration ? (
                              <span className="flex items-center gap-1 text-xs text-white/50">
                                <Clock className="size-3" />
                                {formatDuration(practice.duration)}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {practice.category && (
                            <Badge variant="outline" className="border-white/20 text-xs text-white/70">
                              {practice.category}
                            </Badge>
                          )}

                          {practice.tags?.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="tag" className="text-xs">
                              {tag}
                            </Badge>
                          ))}

                          {practice.tags && practice.tags.length > 3 && (
                            <span className="text-xs text-white/40">+{practice.tags.length - 3} more</span>
                          )}

                          <span className="ml-auto text-xs text-white/40">
                            {formatDate(practice.created_at)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => startEdit(practice)}
                            disabled={saving}
                            className="glass-btn flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
                          >
                            <Pencil className="size-4" />
                            Edit
                          </button>

                          <button
                            onClick={() => deletePractice(practice)}
                            disabled={saving}
                            className="glass-btn flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-medium text-white">Edit Practice</h2>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updatePractice(practice.id)}
                            disabled={saving}
                            className="glass-btn flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
                          >
                            <Check className="size-4" />
                            {saving ? "Saving..." : "Save"}
                          </button>

                          <button
                            onClick={cancelEdit}
                            disabled={saving}
                            className="glass-btn flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
                          >
                            <X className="size-4" />
                            Cancel
                          </button>
                        </div>
                      </div>

                      {editDraft && <PracticeForm draft={editDraft} setDraft={setEditDraft} />}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

function PracticeForm({
  draft,
  setDraft,
}: {
  draft: Draft
  setDraft: React.Dispatch<React.SetStateAction<Draft>>
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="text-xs text-white/70">Title</label>
        <input
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
          placeholder="Practice title"
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-xs text-white/70">Short Summary</label>
        <input
          value={draft.short_summary}
          onChange={(e) => setDraft((d) => ({ ...d, short_summary: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
          placeholder="Short card summary"
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-xs text-white/70">Description</label>
        <textarea
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          className="mt-1 min-h-[100px] w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
          placeholder="Full practice description"
        />
      </div>

      <div>
        <label className="text-xs text-white/70">Category</label>
        <input
          value={draft.category}
          onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
          placeholder="Breathwork, Meditation, Somatic..."
        />
      </div>

      <div>
        <label className="text-xs text-white/70">Duration (minutes)</label>
        <input
          value={draft.duration}
          onChange={(e) => setDraft((d) => ({ ...d, duration: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
          placeholder="10"
        />
      </div>

      <div>
        <label className="text-xs text-white/70">Media Type</label>
        <input
          value={draft.media_type}
          onChange={(e) => setDraft((d) => ({ ...d, media_type: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
          placeholder="video or audio"
        />
      </div>

      <div>
        <label className="text-xs text-white/70">Timer Minutes</label>
        <input
          value={draft.timer_minutes}
          onChange={(e) => setDraft((d) => ({ ...d, timer_minutes: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
          placeholder="10"
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-xs text-white/70">Media URL</label>
        <input
          value={draft.media_url}
          onChange={(e) => setDraft((d) => ({ ...d, media_url: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
          placeholder="https://..."
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-xs text-white/70">Audio URL</label>
        <input
          value={draft.audio_url}
          onChange={(e) => setDraft((d) => ({ ...d, audio_url: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
          placeholder="https://..."
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-xs text-white/70">Cover Image</label>
        <input
          value={draft.cover_image}
          onChange={(e) => setDraft((d) => ({ ...d, cover_image: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
          placeholder="https://..."
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-xs text-white/70">Thumbnail URL</label>
        <input
          value={draft.thumbnail_url}
          onChange={(e) => setDraft((d) => ({ ...d, thumbnail_url: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="text-xs text-white/70">Slug</label>
        <input
          value={draft.slug}
          onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
          placeholder="practice-slug"
        />
      </div>

      <div>
        <label className="text-xs text-white/70">Tags (comma-separated)</label>
        <input
          value={draft.tags}
          onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
          placeholder="calm, breath, reset"
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-xs text-white/70">Instruction Bullets (one per line)</label>
        <textarea
          value={draft.instruction_bullets}
          onChange={(e) => setDraft((d) => ({ ...d, instruction_bullets: e.target.value }))}
          className="mt-1 min-h-[120px] w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
          placeholder={"Sit tall\nRelax the jaw\nRepeat the mantra silently"}
        />
      </div>

      <div className="md:col-span-2">
        <label className="text-xs text-white/70">Mantra</label>
        <input
          value={draft.mantra}
          onChange={(e) => setDraft((d) => ({ ...d, mantra: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
          placeholder="Optional mantra or focus phrase"
        />
      </div>

      <div className="md:col-span-2 flex items-center gap-2 pt-2">
        <input
          id="has_chime"
          type="checkbox"
          checked={draft.has_chime}
          onChange={(e) => setDraft((d) => ({ ...d, has_chime: e.target.checked }))}
        />
        <label htmlFor="has_chime" className="text-sm text-white/80">
          Enable start chime
        </label>
      </div>
    </div>
  )
}