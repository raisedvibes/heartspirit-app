import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/admin/requireAdmin"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalizeOptionalUrl(input: unknown): string | null {
  if (typeof input !== "string") return null
  const t = input.trim()
  if (!t) return null
  try {
    const u = new URL(t)
    if (u.protocol !== "http:" && u.protocol !== "https:") return null
    return u.toString()
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status })
  }

  try {
    const body = await req.json()
    const isActive = Boolean(body?.is_active)

    const { error: deactivateError } = await supabase
      .from("home_promo_cards")
      .update({ is_active: false })
      .eq("is_active", true)

    if (deactivateError) {
      return NextResponse.json({ error: deactivateError.message }, { status: 500 })
    }

    if (!isActive) {
      return NextResponse.json({ homePromo: null }, { status: 200 })
    }

    const title =
      typeof body?.title === "string" && body.title.trim() ? body.title.trim() : ""
    const promoBody =
      typeof body?.body === "string" && body.body.trim() ? body.body.trim() : ""
    const buttonLabel =
      typeof body?.button_label === "string" && body.button_label.trim()
        ? body.button_label.trim()
        : null

    if (!title) {
      return NextResponse.json({ error: "Title is required when activating." }, { status: 400 })
    }
    if (!promoBody) {
      return NextResponse.json({ error: "Body is required when activating." }, { status: 400 })
    }

    const rawUrl = body?.url
    const urlNormalized = normalizeOptionalUrl(rawUrl)
    if (typeof rawUrl === "string" && rawUrl.trim() && !urlNormalized) {
      return NextResponse.json(
        { error: "Invalid URL. Use http or https only." },
        { status: 400 }
      )
    }

    const sortOrder =
      typeof body?.sort_order === "number" && Number.isFinite(body.sort_order)
        ? Math.floor(body.sort_order)
        : 0

    const { data, error } = await supabase
      .from("home_promo_cards")
      .insert([
        {
          title,
          body: promoBody,
          button_label: buttonLabel,
          url: urlNormalized,
          is_active: true,
          sort_order: sortOrder,
        },
      ])
      .select(
        "id, title, body, button_label, url, is_active, sort_order, created_at, updated_at"
      )
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ homePromo: data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 })
  }
}
