"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, BookOpen, Plus, Trash2 } from "lucide-react"

export type JournalEntry = {
  id: string
  title: string
  content: string
  date: string
  time?: string
  mood?: "peaceful" | "grateful" | "centered" | "intentional"
}

interface JournalEntriesProps {
  onNewEntry: () => void
  entries: JournalEntry[]
  onDelete: (id: string) => void
}

/* --- Glass styles (match New Entry button + Rituals page) --- */

const GLASS_CARD =
  "rounded-2xl bg-black/25 backdrop-blur-xl border border-white/25 " +
  "shadow-[0_18px_60px_-34px_rgba(0,0,0,0.85)] text-white"

const GLASS_CARD_HOVER =
  "hover:bg-black/30 hover:border-white/35 transition"

const GLASS_BTN_PRIMARY =
  "inline-flex items-center rounded-xl bg-black/25 border border-white/25 backdrop-blur-md " +
  "text-white px-4 py-2 text-sm font-medium " +
  "shadow-[0_12px_40px_-26px_rgba(0,0,0,0.8)] hover:bg-black/35 hover:border-white/35 transition"

/* Softer mood pills (no white chips) */
const moodColors = {
  peaceful: "bg-blue-400/20 text-blue-200 border border-blue-300/30",
  grateful: "bg-green-400/20 text-green-200 border border-green-300/30",
  centered: "bg-purple-400/20 text-purple-200 border border-purple-300/30",
  intentional: "bg-orange-400/20 text-orange-200 border border-orange-300/30",
} as const

export function JournalEntries({ onNewEntry, entries, onDelete }: JournalEntriesProps) {
  const hasEntries = entries.length > 0

  return (
    <div className="space-y-6">
      {!hasEntries ? (
        /* Empty State */
        <Card className={`p-8 text-center ${GLASS_CARD}`}>
          <BookOpen className="w-12 h-12 text-white/60 mx-auto mb-4" />
          <p className="mb-6 text-pretty text-slate-50">
            Write your first journal entry.
          </p>
          <button onClick={onNewEntry} className={GLASS_BTN_PRIMARY}>
            <Plus className="w-4 h-4 mr-2" />
            Write
          </button>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Entries Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">
              {entries.length} entries
            </span>
          </div>

          {/* Entries List */}
          <div className="space-y-4">
            {entries.map((entry, index) => {
              const dateObj = new Date(entry.date)
              const displayDate = isNaN(dateObj.getTime())
                ? entry.date
                : dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })

              const displayTime =
                entry.time ??
                (isNaN(dateObj.getTime())
                  ? undefined
                  : dateObj.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }))

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.35 }}
                >
                  <Card className={`p-4 ${GLASS_CARD} ${GLASS_CARD_HOVER}`}>
                    <div className="space-y-3">
                      {/* Entry Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          {entry.title && (
                            <h3 className="font-semibold mb-1 text-white">
                              {entry.title}
                            </h3>
                          )}

                          <div className="flex items-center space-x-3 text-xs text-white/70">
                            {displayDate && (
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {displayDate}
                              </div>
                            )}
                            {displayTime && (
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {displayTime}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {entry.mood && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                moodColors[entry.mood]
                              }`}
                            >
                              {entry.mood}
                            </span>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete entry"
                            onClick={() =>
                              confirm("Delete this entry? This cannot be undone.") &&
                              onDelete(entry.id)
                            }
                           className="h-8 w-8 text-white/50 hover:text-white/75 hover:bg-transparent transition-colors"

                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Entry Preview */}
                      <p className="text-sm text-white/80 leading-relaxed line-clamp-3">
                        {entry.content}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
