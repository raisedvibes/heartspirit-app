import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"
import { getOrCreateSessionId } from "@/lib/session"

export const runtime = "nodejs"

export async function GET() {
  const supa = supabaseServer()
  const sid = getOrCreateSessionId()

  const { data, error } = await supa
    .from("messages")
    .select("*")
    .eq("session_id", sid)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ messages: data ?? [] })
}
