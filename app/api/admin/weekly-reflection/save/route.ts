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
    const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : "This week"
    const reflection =
      typeof body?.reflection === "string" && body.reflection.trim() ? body.reflection.trim() : ""
    const weekStart =
      typeof body?.week_start === "string" && body.week_start.trim() ? body.week_start.trim() : null

    if (!reflection) {
      return NextResponse.json({ error: "Reflection is required" }, { status: 400 })
    }

    const { error: deactivateError } = await supabase
      .from("weekly_reflections")
      .update({ is_active: false })
      .eq("is_active", true)

    if (deactivateError) {
      return NextResponse.json({ error: deactivateError.message }, { status: 500 })
    }

    const { data, error } = await supabase
      .from("weekly_reflections")
      .insert([
        {
          title,
          reflection,
          week_start: weekStart,
          is_active: true,
        },
      ])
      .select("id, title, reflection, week_start, is_active, created_at, updated_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ weeklyReflection: data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 })
  }
}
