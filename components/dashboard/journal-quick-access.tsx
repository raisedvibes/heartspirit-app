"use client"

import { PenTool, BookOpen } from "lucide-react"
import Link from "next/link"

export function JournalQuickAccess() {
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex flex-col flex-1">
        <div className="flex items-center mb-4">
          <BookOpen className="w-5 h-5 text-accent mr-2" />
          <h3 className="text-base font-semibold text-white">Journal</h3>
        </div>

        <div className="space-y-4">
          <div className="text-xs text-white/80">
            <p>Last entry:</p>
            <p className="font-medium text-white mt-1">2 days ago</p>
          </div>

          {/* Primary action */}
          <Link
            href="/journal?newEntry=true"
            className="
              rounded-xl border border-white/30
              px-3 py-2 text-xs
              text-white/90
              hover:bg-white/10 hover:text-white
              transition-all
              flex items-center justify-center
            "
          >
            <PenTool className="w-3 h-3 mr-1" />
            New Entry
          </Link>
        </div>
      </div>
    </div>
  )
}
