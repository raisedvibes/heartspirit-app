"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

export default function PracticeTimer({ duration }: { duration: number }) {
  const [timeLeft, setTimeLeft] = useState(duration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [hasStarted, setHasStarted] = useState(false) // track if user started once
  const chime = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!chime.current) return
    chime.current.addEventListener("error", () => {
      console.log("[v0] Audio failed to load, continuing without chime")
    })
    chime.current.load()
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    } else if (isRunning && timeLeft === 0) {
      playChime() // 🔔 chime at end
      setIsRunning(false)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isRunning, timeLeft])

  const playChime = async () => {
    if (!chime.current) return
    try {
      chime.current.currentTime = 0
      await chime.current.play()
    } catch {
      console.log("[v0] Chime playback failed, continuing silently")
    }
  }

  const startTimer = () => {
    if (timeLeft === 0) {
      setTimeLeft(duration * 60) // reset if already finished
    }
    playChime()
    setHasStarted(true)
    setIsRunning(true)
  }

  const resetTimer = () => {
    setTimeLeft(duration * 60)
    setIsRunning(false)
    setHasStarted(false)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Timer display */}
      <div className="text-3xl font-bold">{formatTime(timeLeft)}</div>

      {/* Start / Pause / Reset buttons */}
      <div className="flex gap-2">
        {/* ✅ Start/Resume button → green */}
        {!isRunning && (
          <Button
            onClick={startTimer}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {hasStarted ? "Resume" : "Start"}
          </Button>
        )}

        {/* ✅ Pause button → darker gray */}
        {isRunning && (
          <Button
            onClick={() => setIsRunning(false)}
            className="bg-gray-700 hover:bg-gray-800 text-white"
          >
            Pause
          </Button>
        )}

        {/* ✅ Reset button → light gray */}
      <Button
  onClick={resetTimer}
  className="bg-gray-300 hover:bg-gray-400 text-black"
>
  Reset
</Button>

      </div>

      {/* 🔔 Chime audio */}
      <audio ref={chime} preload="auto">
        <source src="https://tajqnuta9fwavw6h.public.blob.vercel-storage.com/triangle-percussion-ding-smartsound-fx-3-3-00-03.mp3" type="audio/mpeg" />
      </audio>

      {/* ✅ New check-in message */}
      {!isRunning && (
        <p className="text-sm text-center text-muted-foreground font-medium">
          After this practice, check-in with your energy. How has it shifted?
        </p>
      )}
    </div>
  )
}
