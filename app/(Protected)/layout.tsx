import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (!user) redirect("/login")

  // App Store-ready: require confirmed email
  if (!user.email_confirmed_at) {
    await supabase.auth.signOut()
    redirect("/login?notice=confirm_email")
  }

  return <>{children}</>
}
