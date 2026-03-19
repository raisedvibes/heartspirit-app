import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/admin/requireAdmin"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type AssignBody = {
  placement_group: "today" | "season"
  slot_slug: string
  season_key?: string | null
  practice_id: string | null
}

const TODAY_SLOT_ORDER: Record<string, number> = {
  open_the_portal: 0,
  hold_the_frequency: 1,
  return_to_source: 2,
}

const SEASONAL_SLOT_ORDER: Record<string, number> = {
  seasonal_1: 0,
  seasonal_2: 1,
  seasonal_3: 2,
  seasonal_4: 3,
}

export async function POST(req: Request) {
  const admin = await requireAdmin()

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status })
  }

  try {
    const body = (await req.json()) as AssignBody
    const { placement_group, slot_slug, season_key, practice_id } = body

    if (!placement_group || !slot_slug) {
      return NextResponse.json(
        { error: "placement_group and slot_slug are required" },
        { status: 400 }
      )
    }

    if (placement_group === "season" && !season_key) {
      return NextResponse.json(
        { error: "season_key is required for seasonal placements" },
        { status: 400 }
      )
    }

    if (!practice_id?.trim()) {
      return NextResponse.json(
        { error: "practice_id is required" },
        { status: 400 }
      )
    }

    const sortOrder =
      placement_group === "today"
        ? TODAY_SLOT_ORDER[slot_slug] ?? 0
        : SEASONAL_SLOT_ORDER[slot_slug] ?? 0

    let deactivateQuery = supabase
      .from("practice_placements")
      .update({ is_active: false })
      .eq("placement_group", placement_group)
      .eq("slot_slug", slot_slug)
      .eq("is_active", true)

    if (placement_group === "season") {
      deactivateQuery = deactivateQuery.eq("season_key", season_key)
    } else {
      deactivateQuery = deactivateQuery.is("season_key", null)
    }

    const { error: deactivateError } = await deactivateQuery

    if (deactivateError) {
      console.error("Deactivate placement error:", deactivateError)

      return NextResponse.json(
        { error: `Failed to deactivate existing placement: ${deactivateError.message}` },
        { status: 500 }
      )
    }

    const insertRow: Record<string, unknown> = {
      placement_group,
      slot_slug,
      sort_order: sortOrder,
      practice_id: practice_id.trim(),
      is_active: true,
      season_key: placement_group === "season" ? season_key : null,
    }

    const { data, error } = await supabase
      .from("practice_placements")
      .insert(insertRow)
      .select(`
        id,
        slot_slug,
        season_key,
        sort_order,
        practice_id,
        is_active
      `)
      .single()

    if (error) {
      console.error("Insert placement error:", error)
      console.error("Insert row was:", insertRow)

      return NextResponse.json(
        { error: `Failed to assign placement: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, placement: data }, { status: 200 })
  } catch (err: unknown) {
    console.error("Assign placement route error:", err)

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    )
  }
}