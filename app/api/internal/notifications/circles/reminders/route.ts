import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendCircleRemindersNow } from "@/lib/server/notifications/circles"

function isAuthorized(req: Request, method: string): boolean {
  const auth = req.headers.get("authorization") || ""
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  const headerSecret = req.headers.get("x-internal-secret") || ""

  const internal = process.env.INTERNAL_CRON_SECRET
  if (internal && (bearer === internal || headerSecret === internal)) {
    return true
  }

  if (method === "GET") {
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && bearer === cronSecret) {
      return true
    }
  }

  return false
}

async function runReminders(req: Request, method: string) {
  if (!isAuthorized(req, method)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const result = await sendCircleRemindersNow(supabase)
    return NextResponse.json({ ok: true, ...result }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to process circle reminders" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  return runReminders(req, "GET")
}

export async function POST(req: Request) {
  return runReminders(req, "POST")
}
