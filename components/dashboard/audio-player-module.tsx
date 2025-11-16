"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipForward, Headphones } from "lucide-react"

export function AudioPlayerModule() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <Card className="p-4 bg-card border-border shadow-sm h-full">
      <div className="flex flex-col h-full">
        <div className="flex items-center mb-4">
          <Headphones className="w-5 h-5 text-accent mr-2" />
          <h3 className="text-sm font-semibold text-card-foreground">Audio</h3>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="text-xs text-muted-foreground mb-4">
            <p className="font-medium text-card-foreground">Morning Breathwork</p>
            <p className="mt-1">5 min session</p>
          </div>

          <div className="space-y-3">
            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-1">
              <motion.div
                className="bg-accent h-1 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: isPlaying ? "45%" : "0%" }}
                transition={{ duration: 2 }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-2">
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
