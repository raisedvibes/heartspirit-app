"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import TranslucentCard from "@/components/ui/translucent-card"

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
    image: string
    tags: string[]
  }
  isJoined: boolean
  onJoin: () => void
}) {
  return (
    <motion.div whileHover={{ scale: 1.015 }} transition={{ type: "spring", stiffness: 220, damping: 20 }}>
      <TranslucentCard className="overflow-hidden">
        {/* Image */}
        <div className="relative w-full h-40 sm:h-44">
          <Image src={circle.image || "/placeholder.svg"} alt={circle.name} fill className="object-cover" />
          {/* subtle top fade so text area feels grounded */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="text-lg font-semibold text-white">{circle.name}</h3>

          <p className="text-sm text-white/80 line-clamp-3">{circle.description}</p>

          {/* Tags */}
          {circle.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {circle.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white/80 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end pt-2">
            <Button
              size="sm"
              onClick={onJoin}
              className="rounded-xl px-4 py-1.5 text-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-md"
            >
              Reserve
            </Button>
          </div>
        </div>
      </TranslucentCard>
    </motion.div>
  )
}
