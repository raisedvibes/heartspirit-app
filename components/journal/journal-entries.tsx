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

const moodColors = {
  peaceful: "bg-blue-100 text-blue-700",
  grateful: "bg-green-100 text-green-700",
  centered: "bg-purple-100 text-purple-700",
  intentional: "bg-orange-100 text-orange-700",
} as const

export function JournalEntries({ onNewEntry, entries, onDelete }: JournalEntriesProps) {
  const hasEntries = entries.length > 0

  return (
    <div className="space-y-6">
      {!hasEntries ? (
        /* Empty State */
        <Card className="p-8 bg-white border border-neutral-200 shadow-md text-center text-neutral-900">
          <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Start Your Journey</h3>
          <p className="text-neutral-600 mb-6 text-pretty">
            Begin documenting your wellness journey with your first journal entry.
          </p>
          <Button onClick={onNewEntry} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Write First Entry
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Entries Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">
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
                  <Card className="p-4 bg-white border border-neutral-200 shadow-md hover:shadow-lg transition-shadow duration-200 text-neutral-900">
                    <div className="space-y-3">
                      {/* Entry Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          {entry.title && (
                            <h3 className="font-semibold mb-1">
                              {entry.title}
                            </h3>
                          )}

                          <div className="flex items-center space-x-3 text-xs text-neutral-500">
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
                            className="h-8 w-8 text-neutral-400 hover:text-red-500 hover:bg-transparent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Entry Preview */}
                      <p className="text-sm text-neutral-600 leading-relaxed line-clamp-3">
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
