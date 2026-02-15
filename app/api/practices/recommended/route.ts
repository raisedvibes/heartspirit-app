import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const feeling = url.searchParams.get("feeling")?.trim()

  if (!feeling) {
    return NextResponse.json({ error: "Missing feeling" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id ?? null

  // Uses RPC (Step 3) so rotation + priority happens in the DB.
  const { data, error } = await supabase.rpc("get_recommended_practice_v2", {
    feeling_tone: feeling,
    user_id: userId,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // data can be null if none match
  return NextResponse.json({ practice: data ?? null })
}
