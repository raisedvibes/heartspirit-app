"use client"

import Link from "next/link"
import { CircleCard } from "./circle-card"

interface Circle {
  id: string
  name: string
  description: string
  frequency: string
  image: string
  tags: string[]
}

interface FeaturedCirclesProps {
  circles: Circle[]
}

export function FeaturedCircles({ circles }: FeaturedCirclesProps) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 w-max">
        {circles.map((circle) => (
          <div key={circle.id} className="w-80 flex-shrink-0">
            {/* Learn more → Circles page */}
            <Link href="/circles">
              <div className="cursor-pointer">
                <CircleCard
                  circle={circle}
                  isJoined={false}
                  onJoin={() => {}}
                />
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
