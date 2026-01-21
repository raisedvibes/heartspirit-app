"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/layout/navigation"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AdminHome() {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<string | null>(null)

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

  const testCreateCircle = async () => {
    setCreating(true)
    setCreateMsg(null)

    try {
      const res = await fetch("/api/admin/circles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Circle",
          description: "Created from Admin Panel test button",
          frequency: "Weekly",
          is_published: true,
          tags: ["Test"],
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setCreateMsg(`❌ Error: ${json?.error ?? "Unknown error"}`)
        return
      }

      setCreateMsg(`✅ Created: ${json?.circle?.name ?? "Circle created"}`)
      // Optional: log full payload for debugging
      console.log("Created circle:", json)
    } catch (err: any) {
      setCreateMsg(`❌ Error: ${err?.message ?? "Request failed"}`)
    } finally {
      setCreating(false)
    }
  }

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
<Button onClick={() => router.push("/admin/circles")}>
  Manage Circles
</Button>
          {/* TEMP: Test button to validate circles admin -> supabase pipeline */}
          <div className="pt-2">
            <Button onClick={testCreateCircle} disabled={creating}>
              {creating ? "Creating..." : "Test Create Circle"}
            </Button>

            {createMsg ? (
              <p className="mt-2 text-sm text-white/80">{createMsg}</p>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
