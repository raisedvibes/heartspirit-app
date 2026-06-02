import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/admin/requireAdmin"
import { normalizeCircleFrequencyInput } from "@/lib/circles/frequency"
import { mapCircleDbRowToApi } from "@/lib/circles/mapCircleJoinUrl"

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
    const id = body?.id as string | undefined

    if (!id) {
      return NextResponse.json({ error: "Missing circle id" }, { status: 400 })
    }

    const { data: existing, error: existingError } = await supabase
      .from("circles")
      .select("id, name, description, starts_at, is_published, payment_url")
      .eq("id", id)
      .single()

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    // Only update fields that are actually provided
    const updates: Record<string, any> = {}

    if (typeof body.name === "string") updates.name = body.name.trim()

    // Store description exactly as provided (trim only, no length limit)
    if (body.description === null) {
      updates.description = null
    } else if (typeof body.description === "string") {
      const trimmed = body.description.trim()
      updates.description = trimmed || null
    }

    if (body.frequency === null || body.frequency === "") {
      updates.frequency = null
    } else if (typeof body.frequency === "string") {
      const trimmed = body.frequency.trim()
      if (trimmed === "" || trimmed.toLowerCase() === "none") {
        updates.frequency = null
      } else {
        const normalized = normalizeCircleFrequencyInput(body.frequency)
        if (!normalized) {
          return NextResponse.json({ error: "Invalid frequency" }, { status: 400 })
        }
        updates.frequency = normalized
      }
    }
    if (typeof body.image_url === "string") updates.image_url = body.image_url.trim() || null
    if (Array.isArray(body.tags)) updates.tags = body.tags.length ? body.tags : null
    if (typeof body.is_published === "boolean") updates.is_published = body.is_published

    // starts_at can be null or ISO string
    if (body.starts_at === null) updates.starts_at = null
    if (typeof body.starts_at === "string") updates.starts_at = body.starts_at

    // Stored as payment_url in DB; API uses join_url
    if ("join_url" in body) {
      if (body.join_url === null) updates.payment_url = null
      else if (typeof body.join_url === "string") updates.payment_url = body.join_url.trim() || null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("circles")
      .update(updates)
      .eq("id", id)
      .select(
        "id,name,description,frequency,member_count,payment_url,image_url,tags,is_published,starts_at,created_at,updated_at"
      )
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ circle: mapCircleDbRowToApi(data as Record<string, unknown>) }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 })
  }
}
