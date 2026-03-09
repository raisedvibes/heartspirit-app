import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const ADMIN_EMAILS = [
  "guide@wellnessranger.com",
]

export async function requireAdmin() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // ignore when cookies can't be set in this context
          }
        },
      },
    }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { ok: false as const, status: 401, error: "Unauthorized" }
  }

  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    return { ok: false as const, status: 403, error: "Forbidden" }
  }

  return { ok: true as const, user }
}