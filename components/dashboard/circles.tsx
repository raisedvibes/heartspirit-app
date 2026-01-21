"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

export function Circles() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-card rounded-xl p-6 shadow-md border border-border/50 h-full flex flex-col"
    >
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-5 w-5 text-accent" />
          <h3 className="text-base font-semibold text-card-foreground">Circles</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Connect in weekly and monthly circles.
        </p>
      </div>

      {/* 🌿 Unified button hover style */}
      <div className="mt-4 flex justify-end">
        <Link
          href="/circles"
          className="rounded-xl border border-white/30 px-3 py-1.5 text-sm text-muted-foreground hover:bg-white/10 transition-all"
        >
          Join
        </Link>
      </div>
    </motion.div>
  )
}
