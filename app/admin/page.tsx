"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/layout/navigation"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AdminHome() {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  // Simple temporary password check
  useEffect(() => {
    const pass = prompt("Enter admin password:")
    if (pass === process.env.NEXT_PUBLIC_ADMIN_PASS) {
      setAllowed(true)
    } else {
      alert("Access denied")
      router.push("/dashboard")
    }
  }, [router])

  if (!allowed) return null

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="app-main max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

        <div className="grid gap-4">
          <Button onClick={() => router.push("/admin/practices")}>
            Manage Practices
          </Button>

          <Button onClick={() => router.push("/admin/recommendations")}>
            Manage Recommendations
          </Button>

          <Button onClick={() => router.push("/admin/settings")}>
            Admin Settings
          </Button>
        </div>
      </main>
    </div>
  )
}
