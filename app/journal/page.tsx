"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Navigation } from "@/components/layout/navigation"
import { JournalEditor } from "@/components/journal/journal-editor"
import { JournalEntries } from "@/components/journal/journal-entries"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"

type JournalEntry = {
  id: string
  title: string
  content: string
  date: string
  time?: string
  mood?: "peaceful" | "grateful" | "centered" | "intentional"
}

const STORAGE_KEY = "journalEntries"

// Slightly darker translucent "on-glass" styling (matches your Rituals page vibe)
const GLASS_BTN =
  "rounded-xl bg-black/25 border border-white/25 text-white backdrop-blur-md " +
  "shadow-[0_12px_40px_-26px_rgba(0,0,0,0.8)] hover:bg-black/35 hover:border-white/35 transition"

const GLASS_PRIMARY =
  "inline-flex items-center rounded-xl bg-black/25 border border-white/25 backdrop-blur-md " +
  "text-white px-4 py-2 text-sm font-medium " +
  "shadow-[0_12px_40px_-26px_rgba(0,0,0,0.8)] hover:bg-black/35 hover:border-white/35 transition"

export default function JournalPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const prompt = searchParams.get("prompt")
  const newEntry = searchParams.get("newEntry") === "true"

  const [isWriting, setIsWriting] = useState(false)
  const [entries, setEntries] = useState<JournalEntry[]>([])

  // Load existing entries
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setEntries(JSON.parse(raw))
    } catch {
      setEntries([])
    }
  }, [])

  // Open editor if prompt or newEntry is present
  useEffect(() => {
    if (newEntry || prompt) {
      setIsWriting(true)
      router.replace("/journal")
    }
  }, [newEntry, prompt, router])

  const handleDelete = (id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const handleSave = (partial: { title: string; content: string; mood?: JournalEntry["mood"] }) => {
    const now = new Date()
    const newEntry: JournalEntry = {
      id: (crypto as any)?.randomUUID?.() ?? String(Date.now()),
      title: partial.title?.trim() ?? "",
      content: partial.content ?? "",
      date: now.toISOString(),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mood: partial.mood,
    }

    setEntries((prev) => {
      const next = [newEntry, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    setIsWriting(false)
  }

  return (
    <div className="min-h-screen text-white">
      <Navigation />

      <main className="app-main max-w-6xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6 w-full pt-4">
            <Link href="/dashboard" className="shrink-0">
              <Button variant="ghost" size="icon" className={GLASS_BTN}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {!isWriting && (
              <button onClick={() => setIsWriting(true)} className={GLASS_PRIMARY}>
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </button>
            )}

            {isWriting ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <JournalEditor
                  onClose={() => setIsWriting(false)}
                  onSave={handleSave}
                  initialContent={prompt ?? ""}
                />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <JournalEntries onNewEntry={() => setIsWriting(true)} entries={entries} onDelete={handleDelete} />
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
