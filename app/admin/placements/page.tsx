"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, RefreshCw } from "lucide-react"

type Practice = {
  id: string
  title: string
  duration: number | null
  short_summary: string | null
}

type PlacementRow = {
  id: string
  slot_slug: string
  sort_order?: number | null
  practice_id: string
  practice?: Practice | null
  season_key?: string | null
}

type CustomSection = {
  title: string
  subtitle: string | null
  is_active: boolean
}

const TODAY_SLOTS: { slug: string; label: string; description: string }[] = [
  { slug: "open_the_portal", label: "Open the Portal", description: "Morning" },
  { slug: "hold_the_frequency", label: "Hold the Frequency", description: "Midday" },
  { slug: "return_to_source", label: "Return to Source", description: "Evening" },
]

const SEASONAL_SLOTS: { slug: string; label: string }[] = [
  { slug: "seasonal_1", label: "Seasonal 1" },
  { slug: "seasonal_2", label: "Seasonal 2" },
  { slug: "seasonal_3", label: "Seasonal 3" },
  { slug: "seasonal_4", label: "Seasonal 4" },
]

const CUSTOM_SLOTS: { slug: string; label: string }[] = [
  { slug: "custom_1", label: "Custom 1" },
  { slug: "custom_2", label: "Custom 2" },
  { slug: "custom_3", label: "Custom 3" },
  { slug: "custom_4", label: "Custom 4" },
]

const SEASONS = [
  { key: "spring", label: "Spring" },
  { key: "summer", label: "Summer" },
  { key: "autumn", label: "Autumn" },
  { key: "winter", label: "Winter" },
]

function formatDuration(min: number | null) {
  if (!min) return ""
  return `${min} min`
}

function SlotAssignmentRow({
  slotLabel,
  slotDescription,
  currentPlacement,
  practices,
  onSave,
  saving,
}: {
  slotLabel: string
  slotDescription?: string
  currentPlacement: PlacementRow | null
  practices: Practice[]
  onSave: (practiceId: string | null) => Promise<void>
  saving: boolean
}) {
  const [selectedId, setSelectedId] = useState(currentPlacement?.practice_id ?? "")
  const [savingSlot, setSavingSlot] = useState(false)

  useEffect(() => {
    setSelectedId(currentPlacement?.practice_id ?? "")
  }, [currentPlacement?.practice_id])

  const savedPracticeId = currentPlacement?.practice_id ?? ""
  const currentPractice =
    selectedId && selectedId === savedPracticeId ? (currentPlacement?.practice ?? null) : null
  const hasChanges = selectedId !== savedPracticeId

  async function handleSave() {
    setSavingSlot(true)
    try {
      await onSave(selectedId.trim() || null)
    } finally {
      setSavingSlot(false)
    }
  }

  function handleSelectChange(nextId: string) {
    setSelectedId(nextId)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="font-medium text-white">{slotLabel}</div>
        {slotDescription ? (
          <div className="mt-1 text-xs uppercase tracking-wide text-white/45">
            {slotDescription}
          </div>
        ) : null}

        {currentPractice ? (
          <div className="mt-2 text-sm text-white/70">
            <span>{currentPractice.title}</span>
            {currentPractice.duration ? (
              <span className="ml-2 text-white/45">
                {formatDuration(currentPractice.duration)}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="mt-2 text-sm text-white/40">No practice assigned</div>
        )}
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[320px] sm:flex-row sm:items-center">
        <select
          value={selectedId}
          onChange={(e) => handleSelectChange(e.target.value)}
          className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
        >
          <option value="">Select practice…</option>
          {practices.map((practice) => (
            <option key={practice.id} value={practice.id}>
              {practice.title}
              {practice.duration ? ` (${practice.duration} min)` : ""}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || savingSlot || !hasChanges}
          className="glass-btn flex shrink-0 items-center justify-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
        >
          <Check className="size-4" />
          {saving || savingSlot ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  )
}

export default function AdminPlacementsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [practices, setPractices] = useState<Practice[]>([])
  const [todayPlacements, setTodayPlacements] = useState<PlacementRow[]>([])
  const [seasonalPlacements, setSeasonalPlacements] = useState<PlacementRow[]>([])
  const [customPlacements, setCustomPlacements] = useState<PlacementRow[]>([])
  const [selectedSeason, setSelectedSeason] = useState("spring")
  const [customSection, setCustomSection] = useState<CustomSection>({
    title: "Heart Practices",
    subtitle: null,
    is_active: true,
  })

  async function fetchData() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/placements/list", {
        cache: "no-store",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch placements")
      }

      setPractices(data.practices ?? [])
      setTodayPlacements(data.todayPlacements ?? [])
      setSeasonalPlacements(data.seasonalPlacements ?? [])
      setCustomPlacements(data.customPlacements ?? [])
      setCustomSection({
        title: data.customSection?.title ?? "Heart Practices",
        subtitle: data.customSection?.subtitle ?? null,
        is_active: data.customSection?.is_active ?? true,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setPractices([])
      setTodayPlacements([])
      setSeasonalPlacements([])
      setCustomPlacements([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function assignSlot(
    placementGroup: "today" | "season" | "custom",
    slotSlug: string,
    seasonKey: string | null,
    practiceId: string | null
  ) {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/placements/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placement_group: placementGroup,
          slot_slug: slotSlug,
          season_key: seasonKey,
          practice_id: practiceId || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to assign placement")
      }

      await fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to assign placement")
    } finally {
      setSaving(false)
    }
  }

  function getTodayPlacement(slotSlug: string): PlacementRow | null {
    return todayPlacements.find((row) => row.slot_slug === slotSlug) ?? null
  }

  function getSeasonalPlacement(slotSlug: string): PlacementRow | null {
    return (
      seasonalPlacements.find(
        (row) => row.slot_slug === slotSlug && row.season_key === selectedSeason
      ) ?? null
    )
  }

  function getCustomPlacement(slotSlug: string): PlacementRow | null {
    return customPlacements.find((row) => row.slot_slug === slotSlug) ?? null
  }

  async function saveCustomSection() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/placements/custom-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: customSection.title,
          subtitle: customSection.subtitle,
          is_active: customSection.is_active,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save custom section")
      await fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save custom section")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="app-main px-4 pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="glass-btn flex size-9 items-center justify-center"
            >
              <ArrowLeft className="size-4" />
            </Link>

            <div>
              <h1 className="text-xl font-semibold text-white">Energy Placements</h1>
              <p className="text-sm text-white/60">
                Manage Today and Seasonal practice assignments for the Energy page
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading || saving}
            className="glass-btn flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="glass-card mb-6 border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {loading && !practices.length ? (
          <div className="glass-card p-8 text-center text-white/60">
            <RefreshCw className="mx-auto mb-3 size-6 animate-spin" />
            Loading placements…
          </div>
        ) : (
          <div className="space-y-6">
            <section className="glass-card p-4">
              <h2 className="mb-2 text-lg font-medium text-white">Today</h2>
              <p className="mb-4 text-sm text-white/60">
                Three fixed time-of-day placements. One active practice per slot.
              </p>

              <div className="space-y-3">
                {TODAY_SLOTS.map((slot) => (
                  <SlotAssignmentRow
                    key={slot.slug}
                    slotLabel={slot.label}
                    slotDescription={slot.description}
                    currentPlacement={getTodayPlacement(slot.slug)}
                    practices={practices}
                    onSave={(practiceId) =>
                      assignSlot("today", slot.slug, null, practiceId)
                    }
                    saving={saving}
                  />
                ))}
              </div>
            </section>

            <section className="glass-card p-4">
              <h2 className="mb-2 text-lg font-medium text-white">Seasonal</h2>
              <p className="mb-4 text-sm text-white/60">
                Four slots per season. One active practice per slot for each season.
              </p>

              <div className="mb-4 flex flex-wrap gap-2">
                {SEASONS.map((season) => {
                  const isActive = selectedSeason === season.key

                  return (
                    <button
                      key={season.key}
                      type="button"
                      onClick={() => setSelectedSeason(season.key)}
                      className={`glass-btn px-3 py-2 text-sm ${
                        isActive ? "border-white/35 bg-white/15" : ""
                      }`}
                    >
                      {season.label}
                    </button>
                  )
                })}
              </div>

              <div className="space-y-3">
                {SEASONAL_SLOTS.map((slot) => (
                  <SlotAssignmentRow
                    key={`${selectedSeason}-${slot.slug}`}
                    slotLabel={slot.label}
                    currentPlacement={getSeasonalPlacement(slot.slug)}
                    practices={practices}
                    onSave={(practiceId) =>
                      assignSlot("season", slot.slug, selectedSeason, practiceId)
                    }
                    saving={saving}
                  />
                ))}
              </div>
            </section>

            <section className="glass-card p-4">
              <h2 className="mb-2 text-lg font-medium text-white">Custom Section</h2>
              <p className="mb-4 text-sm text-white/60">
                Optional configurable section shown after Seasonal on mobile Energy.
              </p>

              <div className="mb-4 space-y-3 rounded-xl border border-white/10 bg-black/10 p-4">
                <div>
                  <div className="mb-1 text-xs uppercase tracking-wide text-white/45">Section Title</div>
                  <input
                    value={customSection.title}
                    onChange={(e) =>
                      setCustomSection((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
                    placeholder="Heart Practices"
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs uppercase tracking-wide text-white/45">Section Subtitle (optional)</div>
                  <input
                    value={customSection.subtitle ?? ""}
                    onChange={(e) =>
                      setCustomSection((prev) => ({
                        ...prev,
                        subtitle: e.target.value || null,
                      }))
                    }
                    className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-white outline-none focus:border-white/35"
                    placeholder="Optional"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={customSection.is_active}
                    onChange={(e) =>
                      setCustomSection((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                  />
                  Active
                </label>
                <div>
                  <button
                    type="button"
                    onClick={saveCustomSection}
                    disabled={saving}
                    className="glass-btn flex items-center justify-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <Check className="size-4" />
                    {saving ? "Saving…" : "Save Section"}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {CUSTOM_SLOTS.map((slot) => (
                  <SlotAssignmentRow
                    key={slot.slug}
                    slotLabel={slot.label}
                    currentPlacement={getCustomPlacement(slot.slug)}
                    practices={practices}
                    onSave={(practiceId) => assignSlot("custom", slot.slug, null, practiceId)}
                    saving={saving}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}