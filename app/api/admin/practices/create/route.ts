import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/admin/requireAdmin"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalizeString(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed || null
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return null
  const cleaned = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
  return cleaned.length ? cleaned : null
}

function normalizeInstructionBullets(value: unknown) {
  if (!Array.isArray(value)) return null
  const cleaned = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
  return cleaned.length ? cleaned : null
}

function normalizeRecommendationAssignments(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      const feeling_slug =
        typeof item?.feeling_slug === "string" ? item.feeling_slug.trim() : ""

      const support_mode_slug =
        typeof item?.support_mode_slug === "string" ? item.support_mode_slug.trim() : ""

      const sequence_index =
        typeof item?.sequence_index === "number" && Number.isFinite(item.sequence_index)
          ? item.sequence_index
          : null

      if (!feeling_slug || !support_mode_slug || !sequence_index) return null

      return {
        feeling_slug,
        support_mode_slug,
        sequence_index,
      }
    })
    .filter(Boolean) as Array<{
    feeling_slug: string
    support_mode_slug: string
    sequence_index: number
  }>
}

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status })
  }

  try {
    const body = await req.json()

    const title = normalizeString(body?.title)
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const duration =
      typeof body?.duration === "number" && Number.isFinite(body.duration)
        ? body.duration
        : null

    const timerMinutes =
      typeof body?.timer_minutes === "number" && Number.isFinite(body.timer_minutes)
        ? body.timer_minutes
        : null

    const recommendationAssignments = normalizeRecommendationAssignments(
      body?.recommendation_assignments
    )

    const payload = {
      title,
      description: normalizeString(body?.description),
      category: normalizeString(body?.category),
      duration,
      media_url: normalizeString(body?.media_url),
      slug: normalizeString(body?.slug),
      tags: normalizeStringArray(body?.tags),
      short_summary: normalizeString(body?.short_summary),
      audio_url: normalizeString(body?.audio_url),
      cover_image: normalizeString(body?.cover_image),
      media_type: normalizeString(body?.media_type),
      thumbnail_url: normalizeString(body?.thumbnail_url),
      instruction_bullets: normalizeInstructionBullets(body?.instruction_bullets),
      mantra: normalizeString(body?.mantra),
      timer_minutes: timerMinutes,
      has_chime: typeof body?.has_chime === "boolean" ? body.has_chime : true,
    }

    const { data, error } = await supabase
      .from("practices")
      .insert([payload])
      .select(
        "id,title,description,category,duration,media_url,slug,tags,short_summary,audio_url,cover_image,updated_at,created_at,media_type,thumbnail_url,instruction_bullets,mantra,timer_minutes,has_chime"
      )
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (recommendationAssignments.length > 0) {
      const rows = recommendationAssignments.map((item) => ({
        practice_id: data.id,
        feeling_slug: item.feeling_slug,
        support_mode_slug: item.support_mode_slug,
        sequence_index: item.sequence_index,
      }))

      const { error: recError } = await supabase
        .from("practice_recommendations")
        .insert(rows)

      if (recError) {
        return NextResponse.json({ error: recError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ practice: data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 })
  }
}