"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import TranslucentCard from "@/components/ui/translucent-card"
import practices from "@/data/practices.json"
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
  const router = useRouter()

  const handleFeelingSelect = (feelingId: number) => {
    setSelectedFeeling(feelingId)
    setStep("suggestion")
  }

  const getRecommendedPractice = (): Practice | null => {
    if (!selectedFeeling) return null

    const feelingLabel = feelingTones.find((f) => f.id === selectedFeeling)?.name
    if (!feelingLabel) return null

    const matching = practices
      .map((practice: any) => {
        const pairs = practice?.recommendations?.pairs || []
        const bestPriority = pairs
          .filter((p: any) => p.feelingtone === feelingLabel)
          .reduce((max: number, p: any) => Math.max(max, p.priority ?? 0), 0)

        return bestPriority > 0 ? { practice: practice as Practice, priority: bestPriority } : null
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (b?.priority || 0) - (a?.priority || 0))

    return matching.length > 0 ? matching[0]!.practice : null
  }

  const recommendedPractice = getRecommendedPractice()

  const handleStartPractice = () => {
    if (recommendedPractice) {
      router.push(`/practice/${recommendedPractice.id}`)
    }
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

        {step === "suggestion" && recommendedPractice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="text-center">
              <div className="p-4 sm:p-6 rounded-lg bg-accent/20 border border-accent/40">
                <h4 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3">
                  {recommendedPractice.title}
                </h4>

                <p className="text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed text-white/85">
                  {recommendedPractice.description}
                </p>

                <Button
                  onClick={handleStartPractice}
                  variant="outline"
                  className="
                    w-full text-xs sm:text-sm
                    px-4 sm:px-6 py-2 sm:py-3
                    bg-transparent border-white/40 text-white
                    hover:text-white hover:border-accent/60
                  "
                >
                  Start Practice ({recommendedPractice.duration} min)
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </TranslucentCard>
  )
}
