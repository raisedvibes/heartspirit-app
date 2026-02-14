import { createClient } from "@/lib/supabase/server"
import { DashboardView } from "@/components/pages/DashboardView"

type ProfileRow = {
  display_name: string | null
  full_name: string | null
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

  const userName =
    profile?.display_name?.trim() ||
    profile?.full_name?.trim() ||
    undefined

  return <DashboardView userName={userName} />
}
