"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PenTool, BookOpen } from "lucide-react"
import Link from "next/link"

export function JournalQuickAccess() {
  return (
    <Card className="p-4 bg-card border-border shadow-sm h-full flex flex-col">
      <div className="flex flex-col flex-1">
        <div className="flex items-center mb-4">
          <BookOpen className="w-5 h-5 text-accent mr-2" />
          <h3 className="text-base font-semibold text-card-foreground">Journal</h3>
        </div>

        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            <p>Last entry:</p>
            <p className="font-medium text-card-foreground mt-1">2 days ago</p>
          </div>

          <div className="space-y-2">
            {/* New Entry stays solid accent */}
            <Link href="/journal?newEntry=true">
              <Button
                size="sm"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-xs"
              >
                <PenTool className="w-3 h-3 mr-1" />
                New Entry
              </Button>
            </Link>

            {/* 🌿 View All now matches “Reflect” hover style */}
            <Link
              href="/journal"
              className="rounded-xl border border-white/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/10 transition-all flex items-center justify-center"
            >
              View All
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}
