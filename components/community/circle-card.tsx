"use client"

import { motion } from "framer-motion"
import { Users } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function CircleCard({
  circle,
  isJoined,
  onJoin,
}: {
  circle: {
    id: string
    name: string
    description: string
    frequency: string
    memberCount: number
    image: string
    tags: string[]
  }
  isJoined: boolean
  onJoin: () => void
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="
        rounded-2xl overflow-hidden shadow-xl
        border border-white/20
        bg-gradient-to-br from-black/20 via-gray-700/10 to-white/5
        backdrop-blur-xl
      "
    >
      {/* Image */}
      <div className="relative w-full h-40 sm:h-44">
        <Image
          src={circle.image}
          alt={circle.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold text-white">{circle.name}</h3>
        <p className="text-sm text-white/80 line-clamp-3">{circle.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {circle.tags.map((tag, i) => (
            <span
              key={i}
              className="
                text-xs px-2 py-1 rounded-lg
                bg-white/10 border border-white/20
                text-white/80
              "
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-white/80 text-sm">
            <Users className="w-4 h-4" />
            {circle.memberCount}
          </div>

          <Button
            size="sm"
            onClick={onJoin}
            className="
              rounded-xl px-4 py-1.5 text-sm
              bg-white/10 border border-white/20
              text-white hover:bg-white/20 backdrop-blur-md
            "
          >
            {isJoined ? "Joined" : "Join"}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
