"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Pencil, X, Check, Eye, EyeOff, RefreshCcw } from "lucide-react"

import { Navigation } from "@/components/layout/navigation"
import { Button } from "@/components/ui/button"

const GLASS_BTN =
  "rounded-xl bg-black/25 border border-white/25 text-white backdrop-blur-md " +
  "shadow-[0_12px_40px_-26px_rgba(0,0,0,0.8)] hover:bg-black/35 hover:border-white/35 transition"

const GLASS_CARD =
  "rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md " +
  "shadow-[0_14px_60px_-35px_rgba(0,0,0,0.75)]"

type Frequency = "Weekly" | "Monthly"

type Circle = {
  id: string
  name: string
  description: string | null
  frequency: Frequency
  member_count: number
  payment_url: string | null
  image_url: string | null
  tags: string[] | null
  is_published: boolean
  starts_at: string | null
  created_at?: string
  updated_at?: string
}

type Draft = {
  name: string
  description: string
  payment_url: string
  frequency: Frequency
  image_url: string
  tags: string
  is_published: boolean
  starts_at: string
}

function normalizeCircles(payload: any): Circle[] {
  if (!payload) return []
  if (Array.isArray(payload)) return payload as Circle[]
  if (Array.isArray(payload.circles)) return payload.circles as Circle[]
  return []
}

export default function AdminCirclesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [circles, setCircles] = useState<Circle[]>([])

  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "published" | "drafts">("all")

  const [creating, setCreating] = useState(false)
  const [createDraft, setCreateDraft] = useState<Draft>({
    name: "",
    description: "",
    payment_url: "",
    frequency: "Weekly",
    image_url: "",
    tags: "",
    is_published: true,
    starts_at: "",
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Draft | null>(null)

  const fetchList = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/circles/list", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to load circles")
      setCircles(normalizeCircles(json))
    } catch (e: any) {
      setError(e?.message ?? "Failed to load circles")
      setCircles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return circles
      .filter((c) => {
        if (filter === "published") return c.is_published
        if (filter === "drafts") return !c.is_published
        return true
      })
      .filter((c) => {
        if (!q) return true
        const hay = [c.name, c.description ?? "", c.frequency, ...(c.tags ?? [])].join(" ").toLowerCase()
        return hay.includes(q)
      })
  }, [circles, query, filter])

  const parseTags = (raw: string) => {
    const t = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    return t.length ? t : null
  }

  const startEdit = (circle: Circle) => {
    setEditingId(circle.id)
    setEditDraft({
      name: circle.name ?? "",
      description: circle.description ?? "",
      frequency: circle.frequency ?? "Weekly",
      image_url: circle.image_url ?? "",
      payment_url: circle.payment_url ?? "",
      tags: (circle.tags ?? []).join(", "),
      is_published: !!circle.is_published,
      starts_at: circle.starts_at ? circle.starts_at.slice(0, 16) : "",
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft(null)
  }

  const createCircle = async () => {
    if (!createDraft.name.trim()) {
      setError("Name is required.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/circles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createDraft.name.trim(),
          description: createDraft.description.trim() || null,
          payment_url: createDraft.payment_url.trim() || null,
          frequency: createDraft.frequency,
          image_url: createDraft.image_url.trim() || null,
          tags: parseTags(createDraft.tags),
          is_published: createDraft.is_published,
          starts_at: createDraft.starts_at ? new Date(createDraft.starts_at).toISOString() : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to create circle")

      await fetchList()

      setCreating(false)
      setCreateDraft({
        name: "",
        description: "",
        frequency: "Weekly",
        image_url: "",
        payment_url: "",
        tags: "",
        is_published: true,
        starts_at: "",
      })
    } catch (e: any) {
      setError(e?.message ?? "Failed to create circle")
    } finally {
      setSaving(false)
    }
  }

  const updateCircle = async (id: string) => {
    if (!editDraft) return
    if (!editDraft.name.trim()) {
      setError("Name is required.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/circles/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editDraft.name.trim(),
          description: editDraft.description.trim() || null,
          payment_url: editDraft.payment_url.trim() || null,
          frequency: editDraft.frequency,
          image_url: editDraft.image_url.trim() || null,
          tags: parseTags(editDraft.tags),
          is_published: editDraft.is_published,
          starts_at: editDraft.starts_at ? new Date(editDraft.starts_at).toISOString() : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to update circle")

      await fetchList()
      cancelEdit()
    } catch (e: any) {
      setError(e?.message ?? "Failed to update circle")
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (circle: Circle) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/circles/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: circle.id,
          is_published: !circle.is_published,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to update publish state")
      await fetchList()
    } catch (e: any) {
      setError(e?.message ?? "Failed to update publish state")
    } finally {
      setSaving(false)
    }
  }

  const deleteCircle = async (circle: Circle) => {
    const ok = confirm(`Delete circle "${circle.name}"? This cannot be undone.`)
    if (!ok) return

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/circles/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: circle.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Failed to delete circle")
      await fetchList()
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete circle")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen text-white">
      <Navigation />

      <main className="app-main max-w-6xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="pt-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="shrink-0">
                <Button variant="ghost" size="icon" className={GLASS_BTN}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Manage Circles</h1>
                <p className="text-sm text-white/70">Create, publish, and update circles shown on {`/circles`}.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" className={GLASS_BTN} onClick={fetchList} disabled={loading || saving}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>

              <Button variant="ghost" className={GLASS_BTN} onClick={() => setCreating((v) => !v)} disabled={saving}>
                {creating ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {creating ? "Close" : "New Circle"}
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className={`p-4 ${GLASS_CARD} mb-6`}>
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search circles (name, tags, description)…"
                className="w-full md:max-w-md rounded-xl bg-black/20 border border-white/20 text-white placeholder:text-white/50 px-4 py-2 outline-none focus:border-white/35"
              />

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className={filter === "all" ? `${GLASS_BTN} bg-black/35 border-white/35` : GLASS_BTN}
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  className={filter === "published" ? `${GLASS_BTN} bg-black/35 border-white/35` : GLASS_BTN}
                  onClick={() => setFilter("published")}
                >
                  Published
                </Button>
                <Button
                  variant="ghost"
                  className={filter === "drafts" ? `${GLASS_BTN} bg-black/35 border-white/35` : GLASS_BTN}
                  onClick={() => setFilter("drafts")}
                >
                  Drafts
                </Button>
              </div>
            </div>

            {error ? (
              <div className="mt-3 text-sm text-white/80">
                <span className="text-white font-medium">Error:</span> {error}
              </div>
            ) : null}
          </div>

          {/* Create panel */}
          {creating ? (
            <div className={`p-4 ${GLASS_CARD} mb-6`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Create Circle</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-white/70">Name</label>
                  <input
                    value={createDraft.name}
                    onChange={(e) => setCreateDraft((d) => ({ ...d, name: e.target.value }))}
                    className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 text-white px-4 py-2 outline-none focus:border-white/35"
                    placeholder="Circle name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-white/70">Description</label>
                  <textarea
                    value={createDraft.description}
                    onChange={(e) => setCreateDraft((d) => ({ ...d, description: e.target.value }))}
                    className="mt-1 w-full min-h-[90px] rounded-xl bg-black/20 border border-white/20 text-white px-4 py-2 outline-none focus:border-white/35"
                    placeholder="What is this circle about?"
                  />
                  <div className="mt-1 text-xs text-white/50">
                    Shown in full on the Circles page. Dashboard shows only name + date/time.
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/70">Frequency</label>
                  <select
                    value={createDraft.frequency}
                    onChange={(e) => setCreateDraft((d) => ({ ...d, frequency: e.target.value as Frequency }))}
                    className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 text-white px-4 py-2 outline-none focus:border-white/35"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/70">Starts At (optional)</label>
                  <input
                    type="datetime-local"
                    value={createDraft.starts_at}
                    onChange={(e) => setCreateDraft((d) => ({ ...d, starts_at: e.target.value }))}
                    className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 text-white px-4 py-2 outline-none focus:border-white/35"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-white/70">Image URL (optional)</label>
                  <input
                    value={createDraft.image_url}
                    onChange={(e) => setCreateDraft((d) => ({ ...d, image_url: e.target.value }))}
                    className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 text-white px-4 py-2 outline-none focus:border-white/35"
                    placeholder="https://..."
                  />
                </div>

                {/* ✅ Payment URL */}
                <div className="md:col-span-2">
                  <label className="text-xs text-white/70">Payment URL (Join link)</label>
                  <input
                    value={createDraft.payment_url}
                    onChange={(e) => setCreateDraft((d) => ({ ...d, payment_url: e.target.value }))}
                    className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 text-white px-4 py-2 outline-none focus:border-white/35"
                    placeholder="https://your-wix-site.com/..."
                  />
                  <p className="mt-1 text-xs text-white/50">This link opens when someone taps “Join” in the app.</p>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-white/70">Tags (comma-separated)</label>
                  <input
                    value={createDraft.tags}
                    onChange={(e) => setCreateDraft((d) => ({ ...d, tags: e.target.value }))}
                    className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 text-white px-4 py-2 outline-none focus:border-white/35"
                    placeholder="Breathwork, Mindfulness, Grounding"
                  />
                </div>

                <div className="flex items-center gap-2 md:col-span-2 pt-2">
                  <Button variant="ghost" className={GLASS_BTN} onClick={createCircle} disabled={saving}>
                    <Check className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Create"}
                  </Button>
                  <Button
                    variant="ghost"
                    className={GLASS_BTN}
                    onClick={() => setCreateDraft((d) => ({ ...d, is_published: !d.is_published }))}
                    disabled={saving}
                  >
                    {createDraft.is_published ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" /> Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" /> Draft
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {/* List */}
          <div className={`p-4 ${GLASS_CARD}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Circles</h2>
              <div className="text-xs text-white/60">{loading ? "Loading…" : `${filtered.length} shown`}</div>
            </div>

            {loading ? (
              <div className="text-sm text-white/70 py-6">Loading circles…</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-white/70 py-6">No circles match your search/filter.</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filtered.map((c) => {
                  const isEditing = editingId === c.id
                  return (
                    <div key={c.id} className="rounded-xl bg-black/15 border border-white/15 p-4">
                      {!isEditing ? (
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-white truncate">{c.name}</div>
                              <span className="text-xs text-white/60">
                                • {c.frequency} • {c.is_published ? "Published" : "Draft"}
                              </span>
                            </div>

                            {c.description ? (
                              <div className="text-sm text-white/70 mt-1 line-clamp-2">{c.description}</div>
                            ) : null}

                            {c.payment_url ? (
                              <div className="text-xs text-white/60 mt-2 break-all">
                                Join link: <span className="text-white/80">{c.payment_url}</span>
                              </div>
                            ) : (
                              <div className="text-xs text-white/60 mt-2">
                                Join link: <span className="text-white/70">Not set</span>
                              </div>
                            )}

                            {c.tags?.length ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {c.tags.slice(0, 6).map((t) => (
                                  <span
                                    key={t}
                                    className="text-xs px-2 py-1 rounded-lg bg-black/20 border border-white/15 text-white/80"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button variant="ghost" className={GLASS_BTN} onClick={() => togglePublish(c)} disabled={saving}>
                              {c.is_published ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" /> Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" /> Publish
                                </>
                              )}
                            </Button>

                            <Button variant="ghost" className={GLASS_BTN} onClick={() => startEdit(c)} disabled={saving}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </Button>

                            <Button variant="ghost" className={GLASS_BTN} onClick={() => deleteCircle(c)} disabled={saving}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2 flex items-center justify-between">
                            <div className="font-semibold">Editing</div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" className={GLASS_BTN} onClick={() => updateCircle(c.id)} disabled={saving}>
                                <Check className="w-4 h-4 mr-2" />
                                {saving ? "Saving..." : "Save"}
                              </Button>
                              <Button variant="ghost" className={GLASS_BTN} onClick={cancelEdit} disabled={saving}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-xs text-white/70">Name</label>
                            <input
                              value={editDraft?.name ?? ""}
                              onChange={(e) => setEditDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                              className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 text-white px-4 py-2 outline-none focus:border-white/35"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-xs text-white/70">Description</label>
                            <textarea
                              value={editDraft?.description ?? ""}
                              onChange={(e) =>
                                setEditDraft((d) =>
                                  d
                                    ? {
                                      ...d,
                                      description: e.target.value,
                                    }
                                    : d
                                )
                              }
                              className="mt-1 w-full min-h-[90px] rounded-xl bg-black/20 border border-white/20 text-white px-4 py-2 outline-none focus:border-white/35"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-white/70">Frequency</label>
                            <select
                              value={editDraft?.frequency ?? "Weekly"}
                              onChange={(e) => setEditDraft((d) => (d ? { ...d, frequency: e.target.value as Frequency } : d))}
                              className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 text-white px-4 py-2 outline-none focus:border-white/35"
                            >
                              <option value="Weekly">Weekly</option>
                              <option value="Monthly">Monthly</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-white/70">Starts At (optional)</label>
                            <input
                              type="datetime-local"
                              value={editDraft?.starts_at ?? ""}
                              onChange={(e) => setEditDraft((d) => (d ? { ...d, starts_at: e.target.value } : d))}
                              className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 text-white px-4 py-2 outline-none focus:border-white/35"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-xs text-white/70">Image URL (optional)</label>
                            <input
                              value={editDraft?.image_url ?? ""}
                              onChange={(e) => setEditDraft((d) => (d ? { ...d, image_url: e.target.value } : d))}
                              className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 text-white px-4 py-2 outline-none focus:border-white/35"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-xs text-white/70">Payment URL (Join link)</label>
                            <input
                              value={editDraft?.payment_url ?? ""}
                              onChange={(e) => setEditDraft((d) => (d ? { ...d, payment_url: e.target.value } : d))}
                              className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 text-white px-4 py-2 outline-none focus:border-white/35"
                              placeholder="https://your-wix-site.com/..."
                            />
                            <p className="mt-1 text-xs text-white/50">This link opens when someone taps “Join” in the app.</p>
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-xs text-white/70">Tags (comma-separated)</label>
                            <input
                              value={editDraft?.tags ?? ""}
                              onChange={(e) => setEditDraft((d) => (d ? { ...d, tags: e.target.value } : d))}
                              className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 text-white px-4 py-2 outline-none focus:border-white/35"
                            />
                          </div>

                          <div className="flex items-center gap-2 md:col-span-2 pt-1">
                            <Button
                              variant="ghost"
                              className={GLASS_BTN}
                              onClick={() => setEditDraft((d) => (d ? { ...d, is_published: !d.is_published } : d))}
                              disabled={saving}
                            >
                              {editDraft?.is_published ? (
                                <>
                                  <Eye className="w-4 h-4 mr-2" /> Published
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" /> Draft
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
