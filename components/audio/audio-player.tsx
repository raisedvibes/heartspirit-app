"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share } from "lucide-react"

interface AudioPlayerProps {
  currentSession: any
}

const defaultSession = {
  id: 1,
  title: "Morning Breathwork",
  description: "Start your day with intentional breathing to center your energy and set positive intentions.",
  duration: 300, // 5 minutes in seconds
  category: "Breathwork",
  instructor: "Sarah Chen",
  image: "/peaceful-meditation-nature-scene.png",
}

export function AudioPlayer({ currentSession }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState([75])
  const [isFavorited, setIsFavorited] = useState(false)

  const session = currentSession || defaultSession
  const progress = (currentTime / session.duration) * 100

  // Simulate audio progress when playing
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && currentTime < session.duration) {
      interval = setInterval(() => {
        setCurrentTime((prev) => Math.min(prev + 1, session.duration))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentTime, session.duration])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const newTime = Math.floor((value[0] / 100) * session.duration)
    setCurrentTime(newTime)
  }

  return (
    <Card className="p-6 bg-card border-border shadow-lg">
      <div className="space-y-6">
        {/* Session Artwork */}
        <div className="relative">
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 20, repeat: isPlaying ? Number.POSITIVE_INFINITY : 0, ease: "linear" }}
            className="w-48 h-48 mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center"
          >
            <img
              src={session.image || "/placeholder.svg"}
              alt={session.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-purple-500/10" />
          </motion.div>

          {/* Floating Action Buttons */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFavorited(!isFavorited)}
              className="w-9 h-9 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              <Heart className={`w-4 h-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              <Share className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Session Info */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-card-foreground">{session.title}</h2>
          <p className="text-sm text-muted-foreground">{session.instructor}</p>
          <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
            {session.category}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={1}
            className="w-full"
            trackClassName="bg-muted"
            rangeClassName="bg-accent"
            thumbClassName="bg-accent border-accent"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(session.duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-6">
          <Button variant="ghost" size="sm" className="w-12 h-12 p-0">
            <SkipBack className="w-5 h-5" />
          </Button>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handlePlayPause}
              size="lg"
              className="w-16 h-16 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </Button>
          </motion.div>

          <Button variant="ghost" size="sm" className="w-12 h-12 p-0">
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-3">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <Slider
            value={volume}
            onValueChange={setVolume}
            max={100}
            step={1}
            className="flex-1"
            trackClassName="bg-muted"
            rangeClassName="bg-accent"
            thumbClassName="bg-accent border-accent"
          />
          <span className="text-xs text-muted-foreground w-8">{volume[0]}%</span>
        </div>

        {/* Session Description */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{session.description}</p>
        </div>
      </div>
    </Card>
  )
}
