import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type DeletePlan = {
  table: string
  column: "id" | "user_id"
}

const USER_DELETE_PLAN: DeletePlan[] = [
  { table: "user_push_tokens", column: "user_id" },
  { table: "circle_memberships", column: "user_id" },
  { table: "circle_notification_sends", column: "user_id" },
  { table: "profiles", column: "id" },
]

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization") ?? ""
  if (!authHeader.startsWith("Bearer ")) return null
  const token = authHeader.slice(7).trim()
  return token || null
}

function envOrThrow(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const code = "code" in error ? String(error.code ?? "") : ""
  return code === "42P01"
}

async function deleteRowsByUser(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  plan: DeletePlan
) {
  const query =
    plan.column === "id"
      ? supabaseAdmin.from(plan.table).delete().eq("id", userId)
      : supabaseAdmin.from(plan.table).delete().eq("user_id", userId)

  const { error } = await query
  if (error && !isMissingTableError(error)) {
    throw new Error(`Failed deleting ${plan.table}: ${error.message}`)
  }
}

export async function POST(req: Request) {
  try {
    const token = extractBearerToken(req)
    if (!token) {
      return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 })
    }

    const supabaseUrl = envOrThrow("NEXT_PUBLIC_SUPABASE_URL")
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      envOrThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    const serviceRoleKey = envOrThrow("SUPABASE_SERVICE_ROLE_KEY")

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token)
    const user = userData.user
    if (userError || !user) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })
    }

    for (const plan of USER_DELETE_PLAN) {
      await deleteRowsByUser(supabaseAdmin, user.id, plan)
    }

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteAuthError) {
      throw new Error(`Failed deleting auth user: ${deleteAuthError.message}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Account deletion failed"
    console.error("[api/account/delete]", message)
    return NextResponse.json({ error: "Account deletion failed" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

