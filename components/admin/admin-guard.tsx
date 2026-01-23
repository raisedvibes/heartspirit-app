"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

const KEY = "admin_unlocked_v1"
// optional: auto-expire unlock after 12 hours
const TTL_MS = 12 * 60 * 60 * 1000

function isUnlocked() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as { ok: boolean; ts: number }
    if (!parsed?.ok || !parsed?.ts) return false
    if (Date.now() - parsed.ts > TTL_MS) return false
    return true
  } catch {
    return false
  }
}

function setUnlocked() {
  localStorage.setItem(KEY, JSON.stringify({ ok: true, ts: Date.now() }))
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // only guard /admin routes
    if (!pathname?.startsWith("/admin")) {
      setReady(true)
      return
    }

    if (isUnlocked()) {
      setReady(true)
      return
    }

    const pass = prompt("Enter admin password:")
    if (pass && pass === process.env.NEXT_PUBLIC_ADMIN_PASS) {
      setUnlocked()
      setReady(true)
      return
    }

  alert("Access denied")
router.replace("/login")
  }, [router, pathname])

  if (!ready) return null
  return <>{children}</>
}
