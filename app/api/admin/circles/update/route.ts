import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Frequency = "Weekly" | "Monthly"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = body?.id as string | undefined

    if (!id) {
      return NextResponse.json({ error: "Missing circle id" }, { status: 400 })
    }

    // Only update fields that are actually provided
    const updates: Record<string, any> = {}

    if (typeof body.name === "string") updates.name = body.name.trim()
    if (typeof body.description === "string") updates.description = body.description.trim() || null
    if (typeof body.frequency === "string") updates.frequency = body.frequency as Frequency
    if (typeof body.image_url === "string") updates.image_url = body.image_url.trim() || null
    if (Array.isArray(body.tags)) updates.tags = body.tags.length ? body.tags : null
    if (typeof body.is_published === "boolean") updates.is_published = body.is_published

    // starts_at can be null or ISO string
    if (body.starts_at === null) updates.starts_at = null
    if (typeof body.starts_at === "string") updates.starts_at = body.starts_at

    // payment_url can be null or string
    if (body.payment_url === null) updates.payment_url = null
    if (typeof body.payment_url === "string") updates.payment_url = body.payment_url.trim() || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("circles")
      .update(updates)
      .eq("id", id)
      .select("id,name,description,frequency,member_count,payment_url,image_url,tags,is_published,starts_at,created_at,updated_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ circle: data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 })
  }
}
