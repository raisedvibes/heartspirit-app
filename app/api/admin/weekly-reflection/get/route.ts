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
      .from("weekly_reflections")
      .select("id, title, reflection, week_start, is_active, created_at, updated_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ weeklyReflection: data ?? null }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 })
  }
}
