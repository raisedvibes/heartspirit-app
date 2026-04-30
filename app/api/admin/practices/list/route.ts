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
    return NextResponse.json({ error: admin.error }, { status: admin.status })
  }

  try {
    const { data, error } = await supabase
      .from("practices")
      .select(`
        id,
        title,
        description,
        category,
        duration,
        media_url,
        slug,
        tags,
        short_summary,
        audio_url,
        cover_image,
        updated_at,
        created_at,
        media_type,
        thumbnail_url,
        instruction_bullets,
        mantra,
        timer_minutes,
        timer_enabled,
        has_chime,
        practice_recommendations!practice_id(
          feeling_slug,
          support_mode_slug,
          sequence_index
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ practices: data ?? [] }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 })
  }
}