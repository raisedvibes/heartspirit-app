import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/admin/requireAdmin"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status })
  }

  try {
    const body = await req.json()
    const title =
      typeof body?.title === "string" ? body.title.trim() : "Heart Practices"
    const subtitle =
      typeof body?.subtitle === "string" && body.subtitle.trim()
        ? body.subtitle.trim()
        : null
    const isActive =
      typeof body?.is_active === "boolean" ? body.is_active : true

    const { data, error } = await supabase
      .from("energy_section_settings")
      .upsert(
        {
          section_key: "custom",
          title: title || "Heart Practices",
          subtitle,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "section_key" }
      )
      .select("section_key, title, subtitle, is_active")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ customSection: data }, { status: 200 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    )
  }
}
