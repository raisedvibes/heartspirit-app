"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function Navigation() {
  const [hidden, setHidden] = useState(false)
  const [lastY, setLastY] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      setScrolled(y > 8)

      if (y > lastY + 6) setHidden(true)
      else if (y < lastY - 6) setHidden(false)

      setLastY(y)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastY])

  return (
    <motion.nav
      initial={false}
      animate={{ y: hidden ? -64 : 0 }}
      transition={{ type: "tween", duration: 0.2 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        scrolled
          ? "bg-background/20 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      )}
    >
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-semibold text-white hover:text-white/90 transition-colors">
          heartspirit
        </Link>

        <Link href="/settings" aria-label="Settings">
          <Button
            variant="ghost"
            size="sm"
            className="w-9 h-9 p-0 text-white hover:bg-gradient-to-br hover:from-white/10 hover:to-white/5 hover:backdrop-blur-md hover:shadow-inner transition-all"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </motion.nav>
  )
}
