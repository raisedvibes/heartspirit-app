"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TranslucentCard } from "@/components/ui/translucent-card"
import practices from "@/data/practices.json"
import type { Practice } from "@/types/practice"

const energyLevels = [
  { level: 1, label: "Low", batteryFill: "25%" },
  { level: 2, label: "Moderate", batteryFill: "50%" },
  { level: 3, label: "Good", batteryFill: "75%" },
  { level: 4, label: "High", batteryFill: "100%" },
]

const feelingTones = [
  { id: 1, name: "Foggy", emoji: "🌫️" },
  { id: 2, name: "Tired", emoji: "😴" },
  { id: 3, name: "Anxious", emoji: "😰" },
  { id: 4, name: "Irritable", emoji: "😡" },
  { id: 5, name: "Energized", emoji: "⚡" },
  { id: 6, name: "Calm", emoji: "🌊" },
]

/* ---------------- BatteryIcon ---------------- */
const BatteryIcon = ({
  fillPercentage,
  isSelected,
}: {
  fillPercentage: string
  isSelected: boolean
}) => (
  <div className="relative w-7 h-4 mx-auto mb-1 shrink-0">
    {/* battery body */}
    <div
      className={`h-full w-6 border-2 rounded-sm ${
        isSelected ? "border-accent" : "border-gray-600"
      }`}
    >
      <div
        className={`h-full rounded-sm transition-all duration-300 ${
          isSelected ? "bg-accent" : "bg-gray-600"
        }`}
        style={{ width: fillPercentage }}
      />
    </div>
    {/* nub */}
    <div
      className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2 rounded-r-sm ${
        isSelected ? "bg-accent" : "bg-gray-600"
      }`}
    />
  </div>
)

/* ---------------- EnergyCheck ---------------- */
export function EnergyCheck() {
  const [step, setStep] = useState<"energy" | "feeling" | "suggestion">("energy")
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(null)
  const [selectedFeeling, setSelectedFeeling] = useState<number | null>(null)
  const router = useRouter()

  const handleEnergySelect = (level: number) => {
    setSelectedEnergy(level)
    setStep("feeling")
  }

  const handleFeelingSelect = (feelingId: number) => {
    setSelectedFeeling(feelingId)
    setStep("suggestion")
  }

  const resetFlow = () => {
    setStep("energy")
    setSelectedEnergy(null)
    setSelectedFeeling(null)
  }

  const getRecommendedPractice = (): Practice | null => {
    if (!selectedEnergy || !selectedFeeling) return null

    const energyLabel = energyLevels.find((e) => e.level === selectedEnergy)?.label
    const feelingLabel = feelingTones.find((f) => f.id === selectedFeeling)?.name
    if (!energyLabel || !feelingLabel) return null

    const matchingPractices = practices
      .map((practice) => {
        const matchingPair = practice.recommendations.pairs.find(
          (pair) => pair.energy === energyLabel && pair.feelingtone === feelingLabel,
        )
        return matchingPair ? { practice, priority: matchingPair.priority } : null
      })
      .filter(Boolean)
      .sort((a, b) => (b?.priority || 0) - (a?.priority || 0))

    return matchingPractices.length > 0 ? matchingPractices[0]!.practice : null
  }

  const recommendedPractice = getRecommendedPractice()

  const handleStartPractice = () => {
    if (recommendedPractice) {
      router.push(`/practice/${recommendedPractice.id}`)
    }
  }

  return (
    <TranslucentCard className="p-4 sm:p-6 lg:p-8 overflow-hidden">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-[720px] mx-auto">
        {(step === "energy" || step === "feeling") && (
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-center sm:text-left text-gray-800">
              How&apos;s your energy?
            </h3>

            {step === "energy" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                {energyLevels.map((energy) => (
                  <motion.button
                    key={energy.level}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEnergySelect(energy.level)}
                    className="w-full p-3 sm:p-4 lg:p-5 rounded-lg border-2 border-white/40 bg-white/10 hover:border-accent hover:bg-accent/20 transition-all duration-200 flex flex-col items-center justify-center text-center"
                  >
                    <BatteryIcon fillPercentage={energy.batteryFill} isSelected={false} />
                    <span className="block text-center text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                      {energy.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}

            {step === "feeling" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                {feelingTones.map((feeling) => (
                  <motion.button
                    key={feeling.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFeelingSelect(feeling.id)}
                    className="w-full p-3 sm:p-4 lg:p-5 rounded-lg border-2 border-white/40 bg-white/10 hover:border-accent hover:bg-accent/20 transition-all duration-200 flex flex-col items-center justify-center text-center"
                  >
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{feeling.emoji}</div>
                    <span className="block text-center text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                      {feeling.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "suggestion" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="text-center">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
                Recommended Practice
              </h3>

              {recommendedPractice ? (
                <div className="p-4 sm:p-6 rounded-lg bg-accent/20 border border-accent/40">
                  <h4 className="text-sm sm:text-base font-semibold text-accent mb-2 sm:mb-3">
                    {recommendedPractice.title}
                  </h4>
                  <p className="text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed text-gray-700">
                    {recommendedPractice.description}
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                    <Button
                      onClick={handleStartPractice}
                      className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-3"
                    >
                      Start Practice ({recommendedPractice.duration} min)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-6 rounded-lg bg-white/10 border border-white/30">
                  <h4 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 text-gray-700">
                    No Specific Match Found
                  </h4>
                  <p className="text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed text-gray-700">
                    We don&apos;t have a specific practice for this combination yet, but any breathwork practice can help.
                  </p>
                  <div className="flex flex-col items-stretch justify-center">
                    <Button
                      onClick={resetFlow}
                      className="w-full text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-3"
                      variant="outline"
                    >
                      Choose Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </TranslucentCard>
  )
}
