"use client"

import Link from "next/link"
import type { Practice } from "@/types/practice"
import { Clock, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PracticeCardProps {
  practice: Practice
  className?: string
}

export function PracticeCard({ practice, className }: PracticeCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white/20 backdrop-blur-md shadow-md border border-white/30",
        "p-5 sm:p-6 space-y-4",
        "transition-all duration-300 hover:bg-white/25 hover:border-white/40",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-card-foreground line-clamp-2">
            {practice.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {practice.description}
          </p>
        </div>

        <Badge variant="outline" className="shrink-0 bg-white/10 border-white/30 text-card-foreground">
          {practice.category}
        </Badge>
      </div>

      <div className="flex items-center text-sm text-muted-foreground">
        <Clock className="w-4 h-4 mr-2" />
        {practice.duration} minutes
      </div>

      <Link href={`/practice/${practice.id}`} className="block">
        <Button
          variant="outline"
          size="sm"
          className="w-full bg-transparent border-white/40 hover:border-accent/60 hover:bg-accent/10 text-card-foreground"
        >
          <Play className="w-4 h-4 mr-2" />
          Start Practice
        </Button>
      </Link>
    </div>
  )
}
