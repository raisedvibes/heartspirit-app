"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Button } from "@/components/ui/button"
import TranslucentCard from "@/components/ui/translucent-card"
import { Sparkles, ArrowLeft } from "lucide-react"
import practices from "@/data/practices.json"
import type { Practice } from "@/types/practice"

const energyLevels = [
  { level: 1, label: "Low", batteryFill: "25%", color: "from-red-400 to-orange-400" },
  { level: 2, label: "Moderate", batteryFill: "50%", color: "from-yellow-400 to-amber-400" },
  { level: 3, label: "Good", batteryFill: "75%", color: "from-lime-400 to-green-400" },
  { level: 4, label: "High", batteryFill: "100%", color: "from-emerald-400 to-teal-400" },
]

const feelingTones = [
  { id: 1, name: "Foggy", emoji: "🌫️", description: "Mind feels unclear or scattered" },
  { id: 2, name: "Tired", emoji: "😴", description: "Body feels heavy or drained" },
  { id: 3, name: "Anxious", emoji: "😰", description: "Feeling worried or restless" },
  { id: 4, name: "Irritable", emoji: "😡", description: "Easily frustrated or agitated" },
  { id: 5, name: "Energized", emoji: "⚡", description: "Feeling alert and active" },
  { id: 6, name: "Calm", emoji: "🌊", description: "Peaceful and centered" },
]

const BatteryIcon = ({ fillPercentage, gradient }: { fillPercentage: string; gradient: string }) => (
  <div className="relative w-8 h-5 mx-auto mb-2">
    <div className="h-full w-7 border-2 border-white/60 rounded-sm bg-white/10">
      <div
        className={`h-full rounded-sm bg-gradient-to-r ${gradient} transition-all duration-300`}
        style={{ width: fillPercentage }}
      />
    </div>
    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2.5 rounded-r-sm bg-white/60" />
  </div>
)

export default function EnergyCheckAIPage() {
  const [step, setStep] = useState<"energy" | "feeling" | "ai-insight">("energy")
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(null)
  const [selectedFeeling, setSelectedFeeling] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  const handleEnergySelect = (level: number) => {
    setSelectedEnergy(level)
    setTimeout(() => setStep("feeling"), 300)
  }

  const handleFeelingSelect = (feelingId: number) => {
    setSelectedFeeling(feelingId)
    setIsGenerating(true)
    // Simulate AI processing
    setTimeout(() => {
      setIsGenerating(false)
      setStep("ai-insight")
    }, 2000)
  }

  const resetFlow = () => {
    setStep("energy")
    setSelectedEnergy(null)
    setSelectedFeeling(null)
  }

  const getAIRecommendations = (): { primary: Practice | null; alternatives: Practice[] } => {
    if (!selectedEnergy || !selectedFeeling) return { primary: null, alternatives: [] }

    const energyLabel = energyLevels.find((e) => e.level === selectedEnergy)?.label
    const feelingLabel = feelingTones.find((f) => f.id === selectedFeeling)?.name
    if (!energyLabel || !feelingLabel) return { primary: null, alternatives: [] }

    const matchingPractices = practices
      .map((practice) => {
        const matchingPair = practice.recommendations?.pairs.find(
          (pair) => pair.energy === energyLabel && pair.feelingtone === feelingLabel,
        )
        return matchingPair ? { practice, priority: matchingPair.priority } : null
      })
      .filter(Boolean)
      .sort((a, b) => (b?.priority || 0) - (a?.priority || 0))

    return {
      primary: matchingPractices[0]?.practice || null,
      alternatives: matchingPractices.slice(1, 3).map((m) => m!.practice),
    }
  }

  const { primary, alternatives } = getAIRecommendations()
  const selectedEnergyData = energyLevels.find((e) => e.level === selectedEnergy)
  const selectedFeelingData = feelingTones.find((f) => f.id === selectedFeeling)

  const getAIInsight = () => {
    if (!selectedEnergyData || !selectedFeelingData) return ""

    const insights: Record<string, Record<string, string>> = {
      Low: {
        Foggy:
          "Your mind and body are asking for gentle restoration. This is a time to honor your need for clarity and grounding.",
        Tired: "Deep rest is calling. Your system needs nourishment and gentle energy to rebuild.",
        Anxious:
          "Your nervous system is seeking safety and calm. Slow, intentional practices will help you return to center.",
        Irritable:
          "Tension is stored in your body. Release practices will help you discharge this energy and find ease.",
      },
      Moderate: {
        Foggy: "You have enough energy to clear the fog. Focused breathwork will sharpen your awareness.",
        Anxious: "Your energy is present but scattered. Grounding practices will help you channel it wisely.",
        Irritable: "There's fire beneath the surface. Transform this energy through intentional movement and breath.",
        Energized: "You're building momentum. Channel this energy into practices that create flow and focus.",
      },
      Good: {
        Anxious: "You have the energy to work with your anxiety. Use it to create calm and clarity.",
        Energized: "Your energy is strong and ready. Deepen your practice to cultivate mastery.",
        Calm: "You're in a beautiful state of balance. Maintain this through consistent practice.",
      },
      High: {
        Anxious: "Your high energy needs direction. Channel it into practices that create inner peace.",
        Energized: "You're at peak vitality. This is the time for advanced practices and deep transformation.",
        Calm: "You've achieved a rare state of energized peace. Sustain this through mindful practice.",
      },
    }

    return (
      insights[selectedEnergyData.label]?.[selectedFeelingData.name] ||
      "Your unique energy state is recognized. Let's find the perfect practice for you."
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/5">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2 text-accent">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">AI-Powered Insights</span>
            </div>
          </div>

          {/* Main Card */}
          <TranslucentCard className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Energy Level */}
              {step === "energy" && (
                <motion.div
                  key="energy"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-card-foreground">How's your energy right now?</h2>
                    <p className="text-sm text-muted-foreground">Be honest with yourself - there's no wrong answer</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {energyLevels.map((energy) => (
                      <motion.button
                        key={energy.level}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEnergySelect(energy.level)}
                        className="p-5 rounded-xl border-2 border-white/40 bg-white/10 hover:border-accent hover:bg-accent/20 transition-all duration-200 flex flex-col items-center justify-center"
                      >
                        <BatteryIcon fillPercentage={energy.batteryFill} gradient={energy.color} />
                        <span className="text-sm font-medium text-card-foreground">{energy.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Feeling Tone */}
              {step === "feeling" && (
                <motion.div
                  key="feeling"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-card-foreground">What's the quality of your energy?</h2>
                    <p className="text-sm text-muted-foreground">
                      How does your {selectedEnergyData?.label.toLowerCase()} energy feel?
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {feelingTones.map((feeling) => (
                      <motion.button
                        key={feeling.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleFeelingSelect(feeling.id)}
                        className="p-5 rounded-xl border-2 border-white/40 bg-white/10 hover:border-accent hover:bg-accent/20 transition-all duration-200 flex flex-col items-center text-center space-y-2"
                      >
                        <div className="text-3xl">{feeling.emoji}</div>
                        <div>
                          <div className="text-sm font-medium text-card-foreground">{feeling.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{feeling.description}</div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <Button variant="ghost" onClick={resetFlow} className="w-full">
                    Change Energy Level
                  </Button>
                </motion.div>
              )}

              {/* Loading State */}
              {isGenerating && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 text-center space-y-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-16 h-16 mx-auto"
                  >
                    <Sparkles className="w-full h-full text-accent" />
                  </motion.div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-card-foreground">Analyzing your energy...</h3>
                    <p className="text-sm text-muted-foreground">Creating personalized recommendations</p>
                  </div>
                </motion.div>
              )}

              {/* Step 3: AI Insights */}
              {step === "ai-insight" && !isGenerating && (
                <motion.div
                  key="insight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Energy Summary */}
                  <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-accent/10 border border-accent/30">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Energy</div>
                      <div className="text-sm font-semibold text-card-foreground">{selectedEnergyData?.label}</div>
                    </div>
                    <div className="w-px h-8 bg-accent/30" />
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Feeling</div>
                      <div className="text-sm font-semibold text-card-foreground">{selectedFeelingData?.name}</div>
                    </div>
                  </div>

                  {/* AI Insight */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 space-y-3">
                    <div className="flex items-center gap-2 text-accent">
                      <Sparkles className="w-5 h-5" />
                      <h3 className="font-semibold">AI Insight</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-card-foreground/90">{getAIInsight()}</p>
                  </div>

                  {/* Primary Recommendation */}
                  {primary && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-card-foreground">Recommended Practice</h3>
                      <div className="p-5 rounded-xl bg-white/20 border border-white/40 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-card-foreground mb-2">{primary.title}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{primary.description}</p>
                          </div>
                          <span className="text-xs font-medium text-accent bg-accent/20 px-2 py-1 rounded">
                            {primary.duration} min
                          </span>
                        </div>
                        <Button
                          onClick={() => router.push(`/practice/${primary.id}`)}
                          className="w-full bg-accent hover:bg-accent/90 text-white"
                        >
                          Start Practice
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Alternative Practices */}
                  {alternatives.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground">Other Options</h3>
                      <div className="space-y-2">
                        {alternatives.map((practice) => (
                          <button
                            key={practice.id}
                            onClick={() => router.push(`/practice/${practice.id}`)}
                            className="w-full p-4 rounded-lg bg-white/10 border border-white/30 hover:bg-white/20 hover:border-accent/50 transition-all text-left"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-card-foreground truncate">{practice.title}</h4>
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">{practice.duration} min</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reset Button */}
                  <Button variant="outline" onClick={resetFlow} className="w-full bg-transparent">
                    Check Energy Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </TranslucentCard>
        </motion.div>
      </main>
    </div>
  )
}
