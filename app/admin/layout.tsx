"use client"

import { AdminGuard } from "@/components/admin/admin-guard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-black/90 text-white">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.75),transparent_60%)]" />
        {children}
      </div>
    </AdminGuard>
  )
}
