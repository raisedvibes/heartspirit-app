"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/layout/navigation"
import { Button } from "@/components/ui/button"
import { Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CircleCard } from "@/components/community/circle-card"

// Mock data for circles
const mockCircles = [
  {
    id: "1",
    name: "7-Day Breathwork Reset",
    description: "Transform your energy through daily breathwork practices and mindful awareness.",
    frequency: "Weekly",
    memberCount: 127,
    image: "/peaceful-meditation-breathwork.png",
    tags: ["Breathwork", "Energy", "Mindfulness"],
  },
  {
    id: "2",
    name: "Moon Cycle Meditation",
    description: "Align with lunar rhythms through guided meditation and reflection practices.",
    frequency: "Monthly",
    memberCount: 89,
    image: "/moon-meditation-night-sky.png",
    tags: ["Meditation", "Lunar", "Reflection"],
  },
  {
    id: "3",
    name: "Nature Connection Circle",
    description: "Weekly gatherings to deepen your relationship with the natural world.",
    frequency: "Weekly",
    memberCount: 156,
    image: "/forest-nature-connection.png",
    tags: ["Nature", "Connection", "Grounding"],
  },
  {
    id: "4",
    name: "Chakra Healing Journey",
    description: "Monthly deep dive into chakra balancing and energy healing practices.",
    frequency: "Monthly",
    memberCount: 73,
    image: "/chakra-healing-energy-colors.png",
    tags: ["Chakra", "Healing", "Energy"],
  },
  {
    id: "5",
    name: "Morning Mindfulness",
    description: "Start your day with intention through guided morning practices.",
    frequency: "Weekly",
    memberCount: 203,
    image: "/sunrise-morning-meditation.png",
    tags: ["Morning", "Mindfulness", "Intention"],
  },
]

export default function CommunityPage() {
  const [filterFrequency, setFilterFrequency] =
    useState<"All" | "Weekly" | "Monthly">("All")
  const [joinedCircles, setJoinedCircles] = useState<string[]>([])

  const filteredCircles = mockCircles.filter((circle) => {
    return filterFrequency === "All" || circle.frequency === filterFrequency
  })

  const handleJoinCircle = (circleId: string) => {
    setJoinedCircles((prev) =>
      prev.includes(circleId)
        ? prev.filter((id) => id !== circleId)
        : [...prev, circleId]
    )
  }

  return (
    <div className="min-h-screen text-white">
      <Navigation />

      <main className="app-main max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 w-full">
            <Link href="/dashboard" className="shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Browse All */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold text-white">Browse All Circles</h2>

              <div className="flex gap-2">
                {(["All", "Weekly", "Monthly"] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={filterFrequency === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterFrequency(filter)}
                    className={
                      filterFrequency === filter
                        ? "bg-accent text-accent-foreground"
                        : "bg-white/20 text-white border-white/30 hover:bg-white/30"
                    }
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>

            {filteredCircles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCircles.map((circle, index) => (
                  <motion.div
                    key={circle.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * index, duration: 0.45 }}
                  >
                    <CircleCard
                      circle={circle}
                      isJoined={joinedCircles.includes(circle.id)}
                      onJoin={() => handleJoinCircle(circle.id)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.45 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-white/20 border border-white/30 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white/80" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No circles found</h3>
                <p className="text-white/70">No circles yet. Check back soon or join a challenge.</p>
              </motion.div>
            )}
          </motion.section>
        </motion.div>
      </main>
    </div>
  )
}
