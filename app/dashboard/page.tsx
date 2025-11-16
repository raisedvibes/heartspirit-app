"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { Navigation } from "@/components/layout/navigation"
import { DecahedronPortal } from "@/components/DecahedronPortal"
import { Rituals } from "@/components/dashboard/rituals"
import { JournalQuickAccess } from "@/components/dashboard/journal-quick-access"
import { Circles } from "@/components/dashboard/circles"
import { Card, CardContent } from "@/components/ui/card"
import { TranslucentCard } from "@/components/ui/translucent-card"
import { MessageSquare } from "lucide-react"
import Link from "next/link"
import mantras from "@/data/mantras.json"

export default function DashboardPage() {
  const todayISO = new Date().toISOString().slice(0, 10)
  const todayMantra = mantras.find((m) => m.date === todayISO)
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

      // Check if response is OK and is audio
      const contentType = res.headers.get("Content-Type") || ""
      if (!res.ok || !contentType.startsWith("audio/")) {
        // Try to parse error as JSON
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

      // Valid audio response - create blob and play
      const blob = await res.blob()
      console.log("[v0] Blob created, size:", blob.size, "type:", blob.type)

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

          {/* 🪶 Mantra Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-full"
          >
            <Card className="p-4 bg-white/20 backdrop-blur-md shadow-md rounded-2xl border border-white/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  <h3 className="text-base font-semibold text-card-foreground">Word</h3>
                </div>
                <Link
                  href={`/journal?prompt=${encodeURIComponent(todayMantra?.text ?? "")}`}
                  className="rounded-xl border border-white/30 px-3 py-1.5 text-sm text-muted-foreground hover:bg-white/10"
                >
                  Reflect
                </Link>
              </div>
              <CardContent className="p-0">
                <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                  {todayMantra ? `“${todayMantra.text}”` : "No mantra for today."}
                </p>
              </CardContent>
            </Card>
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
