"use client"

import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Button } from "@/components/ui/button"
import TranslucentCard from "@/components/ui/translucent-card"

export default function AdminHome() {
  const router = useRouter()

  return (
    <div className="min-h-screen text-white">
      <Navigation />

      <main className="app-main max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

        <TranslucentCard className="w-full p-4 sm:p-6">
          <div className="grid gap-3">
            <Button onClick={() => router.push("/admin/practices")}>
              Manage Practices
            </Button>

            <Button onClick={() => router.push("/admin/placements")}>
              Energy Placements
            </Button>

            <Button onClick={() => router.push("/admin/recommendations")}>
              Manage Recommendations
            </Button>

            <Button onClick={() => router.push("/admin/circles")}>
              Manage Circles
            </Button>

            <Button onClick={() => router.push("/admin/weekly-reflection")}>
              Weekly Reflection
            </Button>

            <Button onClick={() => router.push("/admin/home-promo")}>
              Home promo
            </Button>

            <Button onClick={() => router.push("/admin/settings")}>
              Admin Settings
            </Button>
          </div>
        </TranslucentCard>
      </main>
    </div>
  )
}
