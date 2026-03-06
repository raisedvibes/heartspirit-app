import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { router } from "expo-router"
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native"
import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"
import { IconSymbol } from "@/components/ui/icon-symbol"

type Step = "feeling" | "suggestion"

type MockPractice = {
  id: string
  title: string
  duration?: number
}

const feelingTones = [
  { id: 6, label: "Calm", icon: "drop" },
  { id: 1, label: "Foggy", icon: "cloud" },
  { id: 2, label: "Tired", icon: "moon" },
  { id: 4, label: "Irritable", icon: "face.dashed" }, // meh/frown
  { id: 3, label: "Anxious", icon: "exclamationmark.circle" },
  { id: 5, label: "Energized", icon: "bolt" },
] as const

// TODO: Replace with Supabase-based recommendation logic
function mockGetRecommendation(feeling: string | null): MockPractice | null {
  if (!feeling) return null
  switch (feeling) {
    case "Calm":
      return { id: "box-breathing", title: "Box Breathing", duration: 5 }
    case "Anxious":
      return { id: "body-scan", title: "Body Scan Meditation", duration: 10 }
    default:
      return null
  }
}

interface EnergyCheckProps {
  userName?: string
}

export function EnergyCheck({ userName }: EnergyCheckProps) {
  const [step, setStep] = useState<Step>("feeling")
  const [selectedFeeling, setSelectedFeeling] = useState<number | null>(null)
  const [recommendedPractice, setRecommendedPractice] =
    useState<MockPractice | null>(null)
  const [loading, setLoading] = useState(false)

  const feelingLabel = useMemo(() => {
    if (!selectedFeeling) return null
    return feelingTones.find((f) => f.id === selectedFeeling)?.label ?? null
  }, [selectedFeeling])

  const namePart = userName?.trim() ? `, ${userName.trim()}` : ""

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleFeelingSelect = useCallback((feelingId: number) => {
    setSelectedFeeling(feelingId)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setStep("suggestion"), 160)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleBack = useCallback(() => {
    setStep("feeling")
    setSelectedFeeling(null)
    setRecommendedPractice(null)
  }, [])

  useEffect(() => {
    if (step !== "suggestion" || !feelingLabel) return
    setLoading(true)
    setRecommendedPractice(null)

    const timer = setTimeout(() => {
      setRecommendedPractice(mockGetRecommendation(feelingLabel))
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [step, feelingLabel])

  const handleStartPractice = useCallback(() => {
    if (recommendedPractice) {
      router.push(`/(tabs)/energy/practice/${recommendedPractice.id}`)
    }
  }, [recommendedPractice])

  return (
    <>
      {step === "feeling" && (
        <TranslucentCard>
          <ThemedText type="defaultSemiBold" style={styles.question}>
            How do you feel right now{namePart}?
          </ThemedText>
          <ThemedText type="muted" style={styles.hint}>
            Choose what feels closest.
          </ThemedText>

          <View style={styles.grid}>
            {[0, 1].map((rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {feelingTones.slice(rowIndex * 3, rowIndex * 3 + 3).map((feeling) => (
                  <View key={feeling.id} style={styles.cell}>
                    <Pressable
                      onPress={() => handleFeelingSelect(feeling.id)}
                      style={({ pressed }) => [
                        styles.feelingButton,
                        pressed && styles.feelingButtonPressed,
                        selectedFeeling === feeling.id && styles.feelingButtonSelected,
                      ]}
                    >
                      <View style={styles.feelingInner}>
                        <View style={styles.iconBox}>
                          <IconSymbol name={feeling.icon} size={26} color="#fff" />
                        </View>
                        <View style={styles.labelBox}>
                          <ThemedText
                            type="defaultSemiBold"
                            style={styles.feelingLabel}
                            numberOfLines={1}
                          >
                            {feeling.label}
                          </ThemedText>
                        </View>
                      </View>
                    </Pressable>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </TranslucentCard>
      )}

      {step === "suggestion" && (
        <TranslucentCard>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ThemedText type="defaultSemiBold" style={styles.backText}>
              Back
            </ThemedText>
          </Pressable>

          <View style={styles.recommendationPanel}>
            <ThemedText type="muted" style={styles.recommendationLabel}>
              Recommended for your current energy
            </ThemedText>

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
                <ThemedText type="muted" style={styles.loadingText}>
                  Finding your next ritual…
                </ThemedText>
              </View>
            )}

            {!loading && recommendedPractice && (
              <View style={styles.result}>
                <ThemedText type="defaultSemiBold" style={styles.practiceTitle}>
                  {recommendedPractice.title}
                </ThemedText>

                <Pressable
                  onPress={handleStartPractice}
                  style={({ pressed }) => [
                    styles.startButton,
                    pressed && styles.startButtonPressed,
                  ]}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={styles.startButtonText}
                  >
                    Start Practice
                  </ThemedText>
                </Pressable>

                {typeof recommendedPractice.duration === "number" && (
                  <ThemedText type="muted" style={styles.duration}>
                    ~ {recommendedPractice.duration} min
                  </ThemedText>
                )}
              </View>
            )}

            {!loading && !recommendedPractice && (
              <ThemedText type="muted" style={styles.emptyText}>
                No practice found for this feeling yet.
              </ThemedText>
            )}
          </View>
        </TranslucentCard>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  question: { fontSize: 16 },
  hint: { marginTop: 6, fontSize: 14 },

  grid: { marginTop: 18, paddingHorizontal: 12 },

  row: { flexDirection: "row" },

  cell: {
    flex: 1,
    paddingHorizontal: 6,
    marginBottom: 14,
  },

  feelingButton: {
    width: "100%",
    minHeight: 104,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(0,0,0,0.22)",
    justifyContent: "center",
  },
  feelingButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.45)",
    opacity: 0.92,
  },
  feelingButtonSelected: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.38)",
  },

  feelingInner: {
    alignItems: "center",
    justifyContent: "center",
  },

  iconBox: {
    height: 34,
    width: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  labelBox: {
    height: 20,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  feelingLabel: {
    fontSize: 14,
    lineHeight: 16,
    textAlign: "center",
    includeFontPadding: false,
  },

  backButton: { marginBottom: 16 },
  backText: { fontSize: 14 },

  recommendationPanel: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  recommendationLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: { fontSize: 14 },

  result: { gap: 12 },
  practiceTitle: { fontSize: 18 },

  startButton: {
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "transparent",
  },
  startButtonPressed: { opacity: 0.8 },
  startButtonText: { fontSize: 14 },

  duration: { fontSize: 12 },
  emptyText: { fontSize: 14 },
})