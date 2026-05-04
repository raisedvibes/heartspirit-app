import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/admin/requireAdmin"
import { mapCircleDbRowToApi } from "@/lib/circles/mapCircleJoinUrl"
import { sendCircleActivityNotification } from "@/lib/server/notifications/circles"

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status })
  }
  try {
    const body = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only key
    )

    // Minimal validation
    const name = (body?.name ?? "").toString().trim()
    if (!name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 })
    }

    // Store description exactly as provided (trim only, no length limit)
    const description: string | null = body.description?.trim() || null

    const insertRow: Record<string, unknown> = {
      name,
      description,
      frequency: body.frequency ?? "Weekly",
      image_url: body.image_url ?? null,
      tags: body.tags ?? null,
      is_published: body.is_published ?? true,
      starts_at: body.starts_at ?? null,
    }

    if ("join_url" in body) {
      if (body.join_url === null) insertRow.payment_url = null
      else if (typeof body.join_url === "string") insertRow.payment_url = body.join_url.trim() || null
    }

    const { data, error } = await supabase
      .from("circles")
      .insert([insertRow])
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    try {
      await sendCircleActivityNotification(supabase, {
        circleBefore: null,
        circleAfter: data,
        changedFields: ["name", "description", "starts_at", "is_published"],
      })
    } catch (notifyErr: any) {
      console.warn("[Circles] create activity notification skipped:", notifyErr?.message ?? notifyErr)
    }

    return NextResponse.json({ circle: mapCircleDbRowToApi(data as Record<string, unknown>) }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 })
  }
}
