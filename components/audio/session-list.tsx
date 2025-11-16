"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Clock, User } from "lucide-react"

interface SessionListProps {
  onSessionSelect: (session: any) => void
  currentSession: any
}

const sessions = [
  {
    id: 1,
    title: "Morning Breathwork",
    description: "Start your day with intentional breathing to center your energy and set positive intentions.",
    duration: 300,
    category: "Breathwork",
    instructor: "Sarah Chen",
    image: "/morning-sunrise-meditation.png",
  },
  {
    id: 2,
    title: "Deep Sleep Sounds",
    description: "Gentle nature sounds and binaural beats to guide you into restful, rejuvenating sleep.",
    duration: 1800,
    category: "Sleep",
    instructor: "Michael Rivers",
    image: "/peaceful-night-forest-sounds.png",
  },
  {
    id: 3,
    title: "Chakra Balancing",
    description: "Align your energy centers with guided meditation and healing frequencies.",
    duration: 900,
    category: "Meditation",
    instructor: "Luna Sage",
    image: "/colorful-chakra-energy-healing.png",
  },
  {
    id: 4,
    title: "Stress Release",
    description: "Release tension and anxiety with progressive relaxation and calming breathwork.",
    duration: 600,
    category: "Breathwork",
    instructor: "David Park",
    image: "/calm-peaceful-stress-relief.png",
  },
  {
    id: 5,
    title: "Nature Immersion",
    description: "Connect with the healing power of nature through immersive soundscapes.",
    duration: 1200,
    category: "Nature",
    instructor: "Emma Forest",
    image: "/lush-green-forest-nature-sounds.png",
  },
]

const categoryColors = {
  Breathwork: "bg-blue-500/10 text-blue-700",
  Sleep: "bg-purple-500/10 text-purple-700",
  Meditation: "bg-green-500/10 text-green-700",
  Nature: "bg-emerald-500/10 text-emerald-700",
}

export function SessionList({ onSessionSelect, currentSession }: SessionListProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Available Sessions</h2>

      <div className="space-y-3">
        {sessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <Card
              className={`p-4 bg-card border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                currentSession?.id === session.id ? "border-accent bg-accent/5" : ""
              }`}
              onClick={() => onSessionSelect(session)}
            >
              <div className="flex items-center space-x-4">
                {/* Session Image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-accent/20 to-purple-500/20 flex-shrink-0">
                  <img
                    src={session.image || "/placeholder.svg"}
                    alt={session.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                </div>

                {/* Session Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-card-foreground truncate">{session.title}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 flex-shrink-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSessionSelect(session)
                      }}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                    {session.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {session.instructor}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDuration(session.duration)}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        categoryColors[session.category as keyof typeof categoryColors]
                      }`}
                    >
                      {session.category}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
