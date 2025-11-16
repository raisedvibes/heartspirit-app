"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, BookOpen, Plus, Trash2 } from "lucide-react"

export type JournalEntry = {
  id: string
  title: string
  content: string
  date: string        // ISO string or "YYYY-MM-DD"
  time?: string
  mood?: "peaceful" | "grateful" | "centered" | "intentional"
}

interface JournalEntriesProps {
  onNewEntry: () => void
  entries: JournalEntry[]
  onDelete: (id: string) => void              // ⬅️ new
}

const moodColors = {
  peaceful: "bg-blue-500/20 text-blue-700",
  grateful: "bg-green-500/20 text-green-700",
  centered: "bg-purple-500/20 text-purple-700",
  intentional: "bg-orange-500/20 text-orange-700",
} as const

export function JournalEntries({ onNewEntry, entries, onDelete }: JournalEntriesProps) {
  const hasEntries = entries.length > 0

  return (
    <div className="space-y-6">
      {!hasEntries ? (
        <Card className="p-8 bg-card border-border shadow-sm text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-card-foreground mb-2">Start Your Journey</h3>
          <p className="text-muted-foreground mb-6 text-pretty">
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
            <span className="text-xs sm:text-sm md:text-base text-white/90">
              {entries.length} entries
            </span>
          </div>

          {/* Entries List */}
          <div className="space-y-4">
            {entries.map((entry, index) => {
              const dateObj = new Date(entry.date)
              const displayDate = isNaN(dateObj.getTime())
  ? entry.date
  : dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              const displayTime =
                entry.time ??
                (isNaN(dateObj.getTime())
                  ? undefined
                  : dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.35 }}
                >
                  <Card className="p-4 bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="space-y-3">
                      {/* Entry Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          {entry.title ? (
                            <h3 className="font-semibold text-card-foreground mb-1">{entry.title}</h3>
                          ) : null}
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
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
                                moodColors[entry.mood as keyof typeof moodColors]
                              }`}
                            >
                              {entry.mood}
                            </span>
                          )}

                          {/* Delete button */}
                        <Button
  variant="ghost"
  size="icon"
  aria-label="Delete entry"
  onClick={() => confirm("Delete this entry? This cannot be undone.") && onDelete(entry.id)}
  className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-transparent active:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
>
  <Trash2 className="w-4 h-4" />
</Button>


                        </div>
                      </div>

                      {/* Entry Preview */}
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
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
