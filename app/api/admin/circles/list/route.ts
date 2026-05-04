import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/admin/requireAdmin"
import { mapCircleDbRowToApi } from "@/lib/circles/mapCircleJoinUrl"

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
      .from("circles")
      .select(
        "id,name,description,frequency,member_count,payment_url,image_url,tags,is_published,starts_at,created_at,updated_at"
      )
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const circles = (data ?? []).map((row) => mapCircleDbRowToApi(row as Record<string, unknown>))
    return NextResponse.json({ circles }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 })
  }
}