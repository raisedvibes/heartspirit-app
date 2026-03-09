import { redirect } from "next/navigation"
import { supabaseServer } from "@/lib/supabaseServer"

const ADMIN_EMAILS = ["guide@wellnessranger.com"]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/admin")
  }

  if (!user.email_confirmed_at) {
    redirect("/login?notice=confirm_email")
  }

  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen text-white relative">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-black/45" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.55),transparent_60%)]" />
      {children}
    </div>
  )
}