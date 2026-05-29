import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/admin/requireAdmin"
import { sendManualPracticePushNow } from "@/lib/server/notifications/practices"

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
    const practice_id = typeof body?.practice_id === "string" ? body.practice_id.trim() : ""
    if (!practice_id) {
      return NextResponse.json({ error: "Missing practice_id", ok: false }, { status: 400 })
    }

    const result = await sendManualPracticePushNow(supabase, practice_id)
    if (!result.ok) {
      const status =
        result.error === "Practice not found"
          ? 404
          : result.error?.startsWith("Failed to load")
            ? 500
            : 400
      return NextResponse.json(result, { status })
    }
    return NextResponse.json(result, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
