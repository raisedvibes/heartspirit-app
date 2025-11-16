"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/layout/navigation"
import { AudioPlayer } from "@/components/audio/audio-player"
import { SessionList } from "@/components/audio/session-list"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AudioPage() {
  const [currentSession, setCurrentSession] = useState(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/5">
      <Navigation />

      <main className="pt-20 pb-8 px-4 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {/* Header */}
          <div className="flex items-center mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="w-9 h-9 p-0 mr-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Audio Sessions</h1>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Audio Player */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <AudioPlayer currentSession={currentSession} />
            </motion.div>

            {/* Session List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <SessionList onSessionSelect={setCurrentSession} currentSession={currentSession} />
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
