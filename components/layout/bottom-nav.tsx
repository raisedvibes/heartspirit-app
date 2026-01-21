"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BatteryCharging, Flame, NotebookText, Users, Home } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/energy", label: "Energy", Icon: BatteryCharging },
  { href: "/rituals", label: "Rituals", Icon: Flame },
  { href: "/journal", label: "Journal", Icon: NotebookText },
  { href: "/circles", label: "Circles", Icon: Users },
]

const ALLOWED_PREFIXES = [
  "/dashboard",
  "/energy",
  "/rituals",
  "/journal",
  "/circles",
  "/practice", // ✅ allow nav on practice pages too
]

export function BottomNav() {
  const pathname = usePathname()

  if (!ALLOWED_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) {
    return null
  }

  return (
    <nav
      className={cn(
        "md:hidden fixed inset-x-0 bottom-0 z-50",
        "border-t border-white/10",
        "bg-gray-900/40 backdrop-blur-md", // dark translucent glass
        "pb-[max(env(safe-area-inset-bottom),0px)]",
      )}
      aria-label="Primary"
    >
      <ul className="mx-auto grid max-w-screen-sm grid-cols-5">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname?.startsWith(href))

          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "group flex flex-col items-center justify-center gap-1 py-2.5",
                  "text-xs font-medium transition-colors",
                  active
                    ? "text-white" // active = white
                    : "text-white/70 hover:text-white/90", // improved contrast for inactive nav items
                )}
              >
                <Icon
                  className={cn("h-5 w-5 transition-transform", active ? "scale-110" : "group-hover:scale-105")}
                  aria-hidden="true"
                />
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
