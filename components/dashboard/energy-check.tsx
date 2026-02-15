"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import TranslucentCard from "@/components/ui/translucent-card"
import type { Practice } from "@/types/practice"
import { Cloud, Moon, AlertTriangle, Flame, Zap, Waves } from "lucide-react"

type Step = "feeling" | "suggestion"

const feelingTones = [
  { id: 1, name: "Foggy", icon: Cloud },
  { id: 2, name: "Tired", icon: Moon },
  { id: 3, name: "Anxious", icon: AlertTriangle },
  { id: 4, name: "Irritable", icon: Flame },
  { id: 5, name: "Energized", icon: Zap },
  { id: 6, name: "Calm", icon: Waves },
] as const

export function EnergyCheck({ userName }: { userName?: string }) {
  const [step, setStep] = useState<Step>("feeling")
  const [selectedFeeling, setSelectedFeeling] = useState<number | null>(null)
  const [recommendedPractice, setRecommendedPractice] = useState<Practice | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const feelingLabel = useMemo(() => {
    if (!selectedFeeling) return null
    return feelingTones.find((f) => f.id === selectedFeeling)?.name ?? null
  }, [selectedFeeling])

  const handleFeelingSelect = (feelingId: number) => {
    setSelectedFeeling(feelingId)
    setStep("suggestion")
  }

  useEffect(() => {
    const run = async () => {
      if (step !== "suggestion" || !feelingLabel) return
      setLoading(true)
      setRecommendedPractice(null)

      try {
        const res = await fetch(`/api/practices/recommended?feeling=${encodeURIComponent(feelingLabel)}`, {
          method: "GET",
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "Failed to load recommendation")

        setRecommendedPractice(json.practice ?? null)
      } catch (e) {
        console.error(e)
        setRecommendedPractice(null)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [step, feelingLabel])

  const handleStartPractice = () => {
    if (recommendedPractice) router.push(`/practice/${recommendedPractice.id}`)
  }

  const namePart = userName?.trim() ? `, ${userName.trim()}` : ""

  return (
    <TranslucentCard className="p-4 sm:p-6 lg:p-8 overflow-hidden">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-[720px] mx-auto">
        {step === "feeling" && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white">
                How do you feel right now{namePart}?
              </h3>
              <p className="text-xs sm:text-sm text-center sm:text-left text-white/80">
                Choose what feels closest.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
              {feelingTones.map((feeling) => {
                const Icon = feeling.icon
                return (
                  <motion.button
                    key={feeling.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFeelingSelect(feeling.id)}
                    className="
                      w-full p-3 sm:p-4 lg:p-5 rounded-lg
                      border-2 border-white/20 bg-black/20
                      hover:border-white/40 hover:bg-white/10
                      transition-all duration-200
                      flex flex-col items-center justify-center text-center
                    "
                  >
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 mb-2 text-white" />
                    <span className="block text-center text-xs sm:text-sm font-medium text-white whitespace-nowrap">
                      {feeling.name}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}

        {step === "suggestion" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <div
                className="
                  p-4 sm:p-6 rounded-lg
                  bg-accent/20 border border-accent/40
                  transition-all duration-300
                  hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]
                  hover:border-accent/60
                "
              >
                <p className="text-[11px] sm:text-xs text-white/70 mb-2 tracking-wide uppercase">
                  Recommended for your current energy
                </p>

                {loading && (
                  <p className="text-sm text-white/80">Finding your next ritual…</p>
                )}

                {!loading && recommendedPractice && (
                  <>
                    <h4 className="text-lg sm:text-xl font-semibold text-white tracking-wide mb-4 sm:mb-5">
                      {recommendedPractice.title}
                    </h4>

                    <Button
                      onClick={handleStartPractice}
                      variant="outline"
                      className="
                        w-full text-xs sm:text-sm
                        px-4 sm:px-6 py-2 sm:py-3
                        bg-transparent border-white/40 text-white
                        hover:text-white hover:border-accent/60
                        transition-all duration-300
                      "
                    >
                      Start Practice
                    </Button>

                    {typeof recommendedPractice.duration === "number" && (
                      <p className="mt-2 text-[11px] sm:text-xs text-white/60">
                        ~ {recommendedPractice.duration} min
                      </p>
                    )}
                  </>
                )}

                {!loading && !recommendedPractice && (
                  <p className="text-sm text-white/80">
                    No practice found for this feeling yet.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </TranslucentCard>
  )
}
