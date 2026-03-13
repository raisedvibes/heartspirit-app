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
    const id = typeof body?.id === "string" ? body.id : null

    if (!id) {
      return NextResponse.json({ error: "Practice id is required" }, { status: 400 })
    }

    const updates: Record<string, any> = {}

    if ("title" in body) {
      const title = normalizeString(body.title)
      if (!title) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 })
      }
      updates.title = title
    }

    if ("description" in body) updates.description = normalizeString(body.description)
    if ("category" in body) updates.category = normalizeString(body.category)

    if ("duration" in body) {
      updates.duration =
        typeof body.duration === "number" && Number.isFinite(body.duration)
          ? body.duration
          : null
    }

    if ("media_url" in body) updates.media_url = normalizeString(body.media_url)
    if ("slug" in body) updates.slug = normalizeString(body.slug)
    if ("tags" in body) updates.tags = normalizeStringArray(body.tags)
    if ("short_summary" in body) updates.short_summary = normalizeString(body.short_summary)
    if ("audio_url" in body) updates.audio_url = normalizeString(body.audio_url)
    if ("cover_image" in body) updates.cover_image = normalizeString(body.cover_image)
    if ("media_type" in body) updates.media_type = normalizeString(body.media_type)
    if ("thumbnail_url" in body) updates.thumbnail_url = normalizeString(body.thumbnail_url)

    if ("instruction_bullets" in body) {
      updates.instruction_bullets = normalizeInstructionBullets(body.instruction_bullets)
    }

    if ("mantra" in body) updates.mantra = normalizeString(body.mantra)

    if ("timer_minutes" in body) {
      updates.timer_minutes =
        typeof body.timer_minutes === "number" && Number.isFinite(body.timer_minutes)
          ? body.timer_minutes
          : null
    }

    if ("has_chime" in body) {
      updates.has_chime = typeof body.has_chime === "boolean" ? body.has_chime : true
    }

    const recommendationAssignments =
      "recommendation_assignments" in body
        ? normalizeRecommendationAssignments(body.recommendation_assignments)
        : undefined

    if (
      Object.keys(updates).length === 0 &&
      recommendationAssignments === undefined
    ) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("practices")
      .update(updates)
      .eq("id", id)
      .select(
        "id,title,description,category,duration,media_url,slug,tags,short_summary,audio_url,cover_image,updated_at,created_at,media_type,thumbnail_url,instruction_bullets,mantra,timer_minutes,has_chime"
      )
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (recommendationAssignments !== undefined) {
      const { error: deleteError } = await supabase
        .from("practice_recommendations")
        .delete()
        .eq("practice_id", id)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      if (recommendationAssignments.length > 0) {
        const rows = recommendationAssignments.map((item) => ({
          practice_id: id,
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
    }

    return NextResponse.json({ practice: data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 })
  }
}