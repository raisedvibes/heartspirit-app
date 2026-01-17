import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only key
    )

    // Minimal validation
    if (!body?.name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("circles")
      .insert([
        {
          name: body.name,
          description: body.description ?? null,
          frequency: body.frequency ?? "Weekly",
          image_url: body.image_url ?? null,
          tags: body.tags ?? null,
          is_published: body.is_published ?? true,
          starts_at: body.starts_at ?? null,
        },
      ])
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ circle: data }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 })
  }
}
