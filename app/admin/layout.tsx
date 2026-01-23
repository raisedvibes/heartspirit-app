"use client"

import { AdminGuard } from "@/components/admin/admin-guard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      {/* Keep the app’s normal background (don’t force solid black) */}
      <div className="min-h-screen text-white relative">
        {/* Dark “fade” overlay instead of full black */}
        <div className="pointer-events-none fixed inset-0 -z-10 bg-black/45" />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.55),transparent_60%)]" />
        {children}
      </div>
    </AdminGuard>
  )
}
