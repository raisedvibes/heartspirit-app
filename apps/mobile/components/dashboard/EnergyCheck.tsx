import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useFocusEffect, router } from "expo-router"
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
} from "react-native"
import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"
import { IconSymbol } from "@/components/ui/icon-symbol"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { useAuth } from "@/lib/auth"

type Step = "feeling" | "supportMode"

type PracticeResult = {
  id: string
  title: string
  duration?: number
}

const feelingTones = [
  { id: 1, slug: "calm", label: "Calm", icon: "drop" },
  { id: 2, slug: "foggy", label: "Foggy", icon: "cloud" },
  { id: 3, slug: "tired", label: "Tired", icon: "moon" },
  { id: 4, slug: "anxious", label: "Anxious", icon: "exclamationmark.circle" },
  { id: 5, slug: "irritable", label: "Irritable", icon: "face.dashed" },
  { id: 6, slug: "energized", label: "Energized", icon: "bolt" },
] as const

const supportModes = [
  { slug: "clear_head", label: "Clear my head" },
  { slug: "connect_inward", label: "Connect inward" },
  { slug: "create_space", label: "Create space" },

  { slug: "deep_rest", label: "Deep rest" },
  { slug: "deepen_presence", label: "Deepen presence" },
  { slug: "expand_it", label: "Expand it" },

  { slug: "feel_safe_body", label: "Feel safe in my body" },
  { slug: "focus_it", label: "Focus it" },
  { slug: "gentle_recharge", label: "Gentle recharge" },

  { slug: "gentle_wake", label: "Gently wake up" },
  { slug: "ground_body", label: "Ground into my body" },
  { slug: "ground_it", label: "Ground it" },

  { slug: "light_activation", label: "Light activation" },
  { slug: "maintain_balance", label: "Maintain balance" },
  { slug: "recenter_emotionally", label: "Recenter emotionally" },

  { slug: "release_mental_loops", label: "Release mental loops" },
  { slug: "release_tension", label: "Release tension" },
  { slug: "settle_nervous_system", label: "Settle my nervous system" },
] as const

const supportModesByFeeling: Record<string, string[]> = {
  Calm: ["maintain_balance", "deepen_presence", "expand_it"],
  Foggy: ["clear_head", "focus_it", "light_activation"],
  Tired: ["gentle_wake", "gentle_recharge", "deep_rest"],
  Anxious: ["settle_nervous_system", "feel_safe_body", "release_mental_loops"],
  Irritable: ["release_tension", "create_space", "recenter_emotionally"],
  Energized: ["ground_it", "ground_body", "connect_inward"],
}

interface EnergyCheckProps {
  userName?: string
}

export function EnergyCheck({ userName }: EnergyCheckProps) {
  const [step, setStep] = useState<Step>("feeling")
  const [selectedFeeling, setSelectedFeeling] = useState<number | null>(null)
  const [selectedSupportMode, setSelectedSupportMode] = useState<string | null>(null)
  const [recommendedPractice, setRecommendedPractice] = useState<PracticeResult | null>(null)
  const [loading, setLoading] = useState(false)

  const { user } = useAuth()
  const [resolvedUserName, setResolvedUserName] = useState<string | undefined>(userName)

  const fadeAnim = useRef(new Animated.Value(1)).current
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadResolvedUserName() {
      if (userName?.trim()) {
        setResolvedUserName(userName.trim())
        return
      }

      if (!user?.id) {
        setResolvedUserName(undefined)
        return
      }

      const supabase = getSupabaseClient()
      if (!supabase) {
        setResolvedUserName(undefined)
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single()

      if (!cancelled) {
        if (error) {
          console.log("[EnergyCheck] failed loading display_name", error.message)
          setResolvedUserName(undefined)
        } else {
          setResolvedUserName(data?.display_name ?? undefined)
        }
      }
    }

    loadResolvedUserName()

    return () => {
      cancelled = true
    }
  }, [user?.id, userName])

  const feelingLabel = useMemo(() => {
    if (!selectedFeeling) return null
    return feelingTones.find((f) => f.id === selectedFeeling)?.label ?? null
  }, [selectedFeeling])

  const feelingSlug = useMemo(() => {
    if (!selectedFeeling) return null
    return feelingTones.find((f) => f.id === selectedFeeling)?.slug ?? null
  }, [selectedFeeling])

  const visibleSupportModes = useMemo(() => {
    if (!feelingLabel) return []
    const allowed = supportModesByFeeling[feelingLabel] ?? []
    return supportModes.filter((mode) => allowed.includes(mode.slug))
  }, [feelingLabel])

  const namePart = resolvedUserName?.trim() ? `, ${resolvedUserName.trim()}` : ""

  const resetFlow = useCallback(() => {
    setStep("feeling")
    setSelectedFeeling(null)
    setSelectedSupportMode(null)
    setRecommendedPractice(null)
    setLoading(false)
  }, [])

  const handleFeelingSelect = useCallback((feelingId: number) => {
    setSelectedFeeling(feelingId)
    setSelectedSupportMode(null)
    setRecommendedPractice(null)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setStep("supportMode"), 160)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        resetFlow()

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }).start()
      })
    }, [fadeAnim, resetFlow])
  )

  const handleBack = useCallback(() => {
    setStep("feeling")
    setSelectedFeeling(null)
    setSelectedSupportMode(null)
    setRecommendedPractice(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (step !== "supportMode" || !feelingSlug || !selectedSupportMode) return

    let cancelled = false

    async function loadRecommendation() {
      setLoading(true)
      setRecommendedPractice(null)

      const supabase = getSupabaseClient()
      if (!supabase) {
        if (!cancelled) setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("practice_recommendations")
        .select(`
          sequence_index,
          practice:practices (
            id,
            title,
            duration
          )
        `)
        .eq("feeling_slug", feelingSlug)
        .eq("support_mode_slug", selectedSupportMode)
        .order("sequence_index", { ascending: true })

      if (cancelled) return

      if (error || !data?.length) {
        setRecommendedPractice(null)
        setLoading(false)
        return
      }

      const dayIndex = Math.floor(Date.now() / 86400000)
      const selected = data[dayIndex % data.length]?.practice as
        | { id: string; title: string; duration?: number | null }
        | undefined

      const nextPractice = selected
        ? {
            id: selected.id,
            title: selected.title,
            duration: selected.duration ?? undefined,
          }
        : null

      setRecommendedPractice(nextPractice)
      setLoading(false)

      if (nextPractice) {
        router.push(`/practice/${nextPractice.id}`)
      }
    }

    loadRecommendation()

    return () => {
      cancelled = true
    }
  }, [step, feelingSlug, selectedSupportMode])

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
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

      {step === "supportMode" && (
        <TranslucentCard>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ThemedText type="defaultSemiBold" style={styles.backText}>
              Back
            </ThemedText>
          </Pressable>

          <ThemedText type="defaultSemiBold" style={styles.question}>
            Choose the kind of support you need most
          </ThemedText>

          {loading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
              <ThemedText type="muted" style={styles.loadingText}>
                Finding your next ritual…
              </ThemedText>
            </View>
          ) : (
            <View style={styles.supportModeList}>
              {visibleSupportModes.map((mode) => (
                <Pressable
                  key={mode.slug}
                  onPress={() => {
                    setSelectedSupportMode(mode.slug)
                  }}
                  style={({ pressed }) => [
                    styles.supportModeButton,
                    pressed && styles.supportModeButtonPressed,
                  ]}
                >
                  <ThemedText type="defaultSemiBold" style={styles.supportModeLabel}>
                    {mode.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}

          {!loading && selectedSupportMode && !recommendedPractice && (
            <ThemedText type="muted" style={styles.emptyText}>
              No practice found for this support mode yet.
            </ThemedText>
          )}
        </TranslucentCard>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  question: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 6,
  },

  hint: {
    marginTop: 6,
    fontSize: 14,
    textAlign: "center",
    opacity: 0.85,
  },

  grid: {
    marginTop: 20,
    paddingHorizontal: 6,
    alignItems: "center",
  },

  row: {
    flexDirection: "row",
    justifyContent: "center",
  },

  cell: {
    flex: 1,
    paddingHorizontal: 6,
    marginBottom: 14,
  },

  feelingButton: {
    width: "100%",
    minHeight: 104,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(0,0,0,0.22)",
    justifyContent: "center",
    alignItems: "center",
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

  backButton: {
    marginBottom: 16,
    alignSelf: "flex-start",
  },

  backText: {
    fontSize: 14,
  },

  supportModeList: {
    marginTop: 20,
    gap: 12,
    alignItems: "center",
  },

  supportModeButton: {
    width: "92%",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
  },

  supportModeButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.38)",
  },

  supportModeLabel: {
    fontSize: 15,
    textAlign: "center",
  },

  loadingBlock: {
    marginTop: 20,
    alignItems: "center",
    gap: 10,
  },

  loadingText: {
    fontSize: 14,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 14,
    fontSize: 14,
    textAlign: "center",
  },
})
