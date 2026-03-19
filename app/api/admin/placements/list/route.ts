import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/admin/requireAdmin"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const admin = await requireAdmin()

  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.error },
      { status: admin.status }
    )
  }

  try {
    const [practicesRes, todayRes, seasonalRes] = await Promise.all([
      supabase
        .from("practices")
        .select("id, title, duration, short_summary")
        .order("title", { ascending: true }),

      supabase
        .from("practice_placements")
        .select(`
          id,
          slot_slug,
          sort_order,
          practice_id,
          practice:practices (
            id,
            title,
            duration,
            short_summary
          )
        `)
        .eq("placement_group", "today")
        .eq("is_active", true),

      supabase
        .from("practice_placements")
        .select(`
          id,
          slot_slug,
          season_key,
          sort_order,
          practice_id,
          practice:practices (
            id,
            title,
            duration,
            short_summary
          )
        `)
        .eq("placement_group", "season")
        .eq("is_active", true),
    ])

    if (practicesRes.error) {
      return NextResponse.json(
        { error: practicesRes.error.message },
        { status: 500 }
      )
    }

    if (todayRes.error) {
      return NextResponse.json(
        { error: todayRes.error.message },
        { status: 500 }
      )
    }

    if (seasonalRes.error) {
      return NextResponse.json(
        { error: seasonalRes.error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        practices: practicesRes.data ?? [],
        todayPlacements: todayRes.data ?? [],
        seasonalPlacements: seasonalRes.data ?? [],
      },
      { status: 200 }
    )
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Server error",
      },
      { status: 500 }
    )
  }
}