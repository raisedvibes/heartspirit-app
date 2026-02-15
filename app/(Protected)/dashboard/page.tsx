import { createClient } from "@/lib/supabase/server"
import { DashboardView } from "@/components/pages/DashboardView"

type ProfileRow = {
  display_name: string | null
  full_name: string | null
}

function firstNameFrom(name?: string | null) {
  const n = (name ?? "").trim()
  if (!n) return undefined
  return n.split(/\s+/)[0]
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user

  // ProtectedLayout already guards, but keep it safe
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, full_name")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>()

  const fullName =
    profile?.display_name?.trim() ||
    profile?.full_name?.trim() ||
    undefined

  const firstName = firstNameFrom(fullName)

  return <DashboardView userName={firstName} />
}
