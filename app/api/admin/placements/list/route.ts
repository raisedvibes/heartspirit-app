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
    const [practicesRes, todayRes, seasonalRes, customRes, customSectionRes] = await Promise.all([
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
            short_summary,
            timer_minutes,
            cover_image,
            thumbnail_url
          )
        `)
        .eq("placement_group", "custom")
        .is("season_key", null)
        .eq("is_active", true),

      supabase
        .from("energy_section_settings")
        .select("section_key, title, subtitle, is_active")
        .eq("section_key", "custom")
        .limit(1)
        .maybeSingle(),
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

    if (customRes.error) {
      return NextResponse.json(
        { error: customRes.error.message },
        { status: 500 }
      )
    }

    if (customSectionRes.error) {
      return NextResponse.json(
        { error: customSectionRes.error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        practices: practicesRes.data ?? [],
        todayPlacements: todayRes.data ?? [],
        seasonalPlacements: seasonalRes.data ?? [],
        customPlacements: customRes.data ?? [],
        customSection:
          customSectionRes.data ?? {
            section_key: "custom",
            title: "Heart Practices",
            subtitle: null,
            is_active: true,
          },
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