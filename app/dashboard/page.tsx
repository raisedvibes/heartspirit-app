"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { Navigation } from "@/components/layout/navigation"
import { DecahedronPortal } from "@/components/DecahedronPortal"
import { Rituals } from "@/components/dashboard/rituals"
import { JournalQuickAccess } from "@/components/dashboard/journal-quick-access"
import { Circles } from "@/components/dashboard/circles"
import { TranslucentCard } from "@/components/ui/translucent-card"
import Link from "next/link"

export default function DashboardPage() {
  const [isSpeaking, setIsSpeaking] = useState(false)

  async function speakText(text: string) {
    console.log("[v0] speakText called with:", text)
    try {
      setIsSpeaking(true)
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      console.log("[v0] Response status:", res.status)
      console.log("[v0] Response Content-Type:", res.headers.get("Content-Type"))

      const contentType = res.headers.get("Content-Type") || ""
      if (!res.ok || !contentType.startsWith("audio/")) {
        let errorMsg = "Unknown error"
        try {
          const errorData = await res.json()
          errorMsg = errorData.error || errorMsg
        } catch {
          errorMsg = await res.text()
        }
        console.error("[v0] API error:", errorMsg)
        alert(`Voice error: ${errorMsg}`)
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)

      audio.onerror = (e) => {
        console.error("[v0] Audio element error:", e)
        URL.revokeObjectURL(url)
      }

      audio.onended = () => {
        console.log("[v0] Audio playback ended")
        URL.revokeObjectURL(url)
      }

      await audio.play()
      console.log("[v0] Audio playing successfully")
    } catch (error) {
      console.error("[v0] Error during voice playback:", error)
      alert(`Voice playback failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSpeaking(false)
    }
  }

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden">
      <Navigation />
      <main className="app-main max-w-6xl mx-auto px-4 pb-10 md:pb-16 lg:pb-28">
        <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto space-y-10 mt-12">

          {/* 🌌 Decahedron Voice Portal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="relative flex flex-col items-center justify-center w-full"
          >
            <DecahedronPortal onClick={() => speakText("How’s your energy, Friend?")} />
            {isSpeaking && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                className="text-sm text-accent mt-4"
              >
                Listening to your energy...
              </motion.p>
            )}
          </motion.div>

          {/* 🕯 Daily Rituals + Journal + Circles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full items-stretch">
            <TranslucentCard>
              <Rituals />
            </TranslucentCard>
            <TranslucentCard>
              <JournalQuickAccess />
            </TranslucentCard>
            <TranslucentCard>
              <Circles />
            </TranslucentCard>
          </div>

        </div>
      </main>
    </div>
  )
}
