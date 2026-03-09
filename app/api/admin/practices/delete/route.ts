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
    const id = typeof body?.id === "string" ? body.id : null

    if (!id) {
      return NextResponse.json({ error: "Practice id is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("practices")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 })
  }
}