"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Play } from "lucide-react"
import Link from "next/link"
import type { Practice } from "@/types/practice"

interface PracticeCardProps {
  practice: Practice
}

export function PracticeCard({ practice }: PracticeCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "breathwork":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "meditation":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "somatic":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card className="group overflow-hidden rounded-2xl backdrop-blur-md bg-white/90 border border-white/20 hover:bg-white/95 hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg text-card-foreground group-hover:text-accent transition-colors line-clamp-2">
              {practice.title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {practice.description}
            </CardDescription>
          </div>
          <Badge variant="outline" className={`shrink-0 ${getCategoryColor(practice.category)}`}>
            {practice.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Duration */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="w-4 h-4 mr-2" />
          {practice.duration} minutes
        </div>

        {/* Action Button */}
        <Link href={`/practice/${practice.id}`} className="block">
          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" size="sm">
            <Play className="w-4 h-4 mr-2" />
            Start Practice
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
