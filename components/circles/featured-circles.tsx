"use client"

import { CircleCard } from "./circle-card"

interface Circle {
  id: string
  name: string
  description: string
  frequency: string
  memberCount: number
  image: string
  tags: string[]
}

interface FeaturedCirclesProps {
  circles: Circle[]
  joinedCircles: string[]
  onJoinCircle: (circleId: string) => void
}

export function FeaturedCircles({ circles, joinedCircles, onJoinCircle }: FeaturedCirclesProps) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 w-max">
        {circles.map((circle) => (
          <div key={circle.id} className="w-80 flex-shrink-0">
            <CircleCard
              circle={circle}
              isJoined={joinedCircles.includes(circle.id)}
              onJoin={() => onJoinCircle(circle.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
