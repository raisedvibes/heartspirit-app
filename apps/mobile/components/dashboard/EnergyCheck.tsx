import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useFocusEffect, router } from "expo-router"
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
  Platform,
} from "react-native"
import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"
import { IconSymbol } from "@/components/ui/icon-symbol"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { ANDROID_SCROLL_PRESS_DELAY } from "@/lib/androidScrollPress"
import { useAuth } from "@/lib/auth"
import { getOfflineCacheData, OfflineCacheKeys, setOfflineCache } from "@/lib/offlineCache"

type Step = "feeling" | "supportMode"

type PracticeResult = {
  id: string
  title: string
  duration?: number
}

const GLOBAL_SEQUENCE_COUNT = 3

const feelingTones = [
  { id: 1, slug: "calm", label: "Calm", icon: "drop" },
  { id: 2, slug: "foggy", label: "Foggy", icon: "cloud" },
  { id: 3, slug: "tired", label: "Tired", icon: "moon" },
  { id: 4, slug: "anxious", label: "Anxious", icon: "warning_amber" },
  { id: 5, slug: "irritable", label: "Irritable", icon: "do_not_disturb_on" },
  { id: 6, slug: "energized", label: "Energized", icon: "bolt" },
] as const

interface EnergyCheckProps {
  userName?: string
}

export function EnergyCheck({ userName }: EnergyCheckProps) {
  const [step, setStep] = useState<Step>("feeling")
  const [selectedFeeling, setSelectedFeeling] = useState<number | null>(null)
  const [selectedSupportMode, setSelectedSupportMode] = useState<string | null>(null)
  const [recommendedPractice, setRecommendedPractice] = useState<PracticeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [availableSupportModes, setAvailableSupportModes] = useState<
    Array<{ slug: string; label: string }>
  >([])
  const [usingCachedGuidance, setUsingCachedGuidance] = useState(false)

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
        const cachedName = await getOfflineCacheData<string>(
          OfflineCacheKeys.energy.profileDisplayName(user.id)
        )
        if (cachedName?.trim()) {
          setResolvedUserName(cachedName.trim())
          return
        }
        setResolvedUserName(undefined)
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle()

      if (!cancelled) {
        const fromProfile = data?.display_name?.trim()
        if (fromProfile) {
          void setOfflineCache(OfflineCacheKeys.energy.profileDisplayName(user.id), fromProfile)
          setResolvedUserName(fromProfile)
          return
        }
        const metadataDisplay = (user.user_metadata?.display_name as string | undefined)?.trim()
        const metadataFull = (user.user_metadata?.full_name as string | undefined)?.trim()
        const fallback =
          metadataDisplay ||
          (metadataFull ? metadataFull.split(/\s+/)[0] : undefined)
        setResolvedUserName(fallback ?? undefined)
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

  useEffect(() => {
    let cancelled = false

    async function loadSupportModes() {
      if (!feelingSlug) {
        setAvailableSupportModes([])
        setUsingCachedGuidance(false)
        return
      }

      const supportModesCacheKey = OfflineCacheKeys.energy.supportModes(feelingSlug)
      const supabase = getSupabaseClient()
      if (!supabase) {
        const cachedModes =
          await getOfflineCacheData<Array<{ slug: string; label: string }>>(supportModesCacheKey)
        setAvailableSupportModes(cachedModes ?? [])
        setUsingCachedGuidance(Boolean(cachedModes?.length))
        return
      }

      const { data, error } = await supabase
        .from("support_modes")
        .select("support_mode_slug, support_mode_label")
        .eq("feeling_slug", feelingSlug)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })

      if (!cancelled) {
        if (error) {
          console.log("[EnergyCheck] failed loading support modes", error.message)
          const cachedModes =
            await getOfflineCacheData<Array<{ slug: string; label: string }>>(supportModesCacheKey)
          setAvailableSupportModes(cachedModes ?? [])
          setUsingCachedGuidance(Boolean(cachedModes?.length))
        } else {
          const mappedModes = (data ?? []).map((item) => ({
            slug: item.support_mode_slug,
            label: item.support_mode_label,
          }))
          setAvailableSupportModes(mappedModes)
          setUsingCachedGuidance(false)
          void setOfflineCache(
            supportModesCacheKey,
            (data ?? []).map((item) => ({
              slug: item.support_mode_slug,
              label: item.support_mode_label,
            }))
          )
        }
      }
    }

    loadSupportModes()

    return () => {
      cancelled = true
    }
  }, [feelingSlug])

  const visibleSupportModes = availableSupportModes

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
      // Reset flow when the host screen is focused (e.g. returning from another tab) without
      // a fade cycle — opacity flicker on every tab switch felt jumpy on Home + Energy.
      fadeAnim.stopAnimation()
      fadeAnim.setValue(1)
      resetFlow()
    }, [fadeAnim, resetFlow])
  )

  const handleBack = useCallback(() => {
    fadeAnim.stopAnimation()
    setStep("feeling")
    setSelectedFeeling(null)
    setSelectedSupportMode(null)
    setRecommendedPractice(null)
    setLoading(false)
    fadeAnim.setValue(1)
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.9,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start()
  }, [fadeAnim])

  useEffect(() => {
    if (step !== "supportMode" || !feelingSlug || !selectedSupportMode) return

    let cancelled = false

    async function loadRecommendation() {
      setLoading(true)
      setRecommendedPractice(null)

      const recommendationCacheKey = OfflineCacheKeys.energy.recommendation(
        feelingSlug,
        selectedSupportMode
      )
      const supabase = getSupabaseClient()
      if (!supabase) {
        const cachedPractice = await getOfflineCacheData<PracticeResult>(recommendationCacheKey)
        if (!cancelled) {
          setRecommendedPractice(cachedPractice)
          setUsingCachedGuidance(Boolean(cachedPractice))
          setLoading(false)
        }
        if (cachedPractice) {
          router.push(`/practice/${cachedPractice.id}`)
        }
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
        const cachedPractice = await getOfflineCacheData<PracticeResult>(recommendationCacheKey)
        setRecommendedPractice(cachedPractice)
        setUsingCachedGuidance(Boolean(cachedPractice))
        setLoading(false)
        if (cachedPractice) {
          router.push(`/practice/${cachedPractice.id}`)
        }
        return
      }

      const dayIndex = Math.floor(Date.now() / 86400000)
      const dailySequenceIndex = (dayIndex % GLOBAL_SEQUENCE_COUNT) + 1

      const normalizedRows = [...data].sort(
        (a, b) => (a.sequence_index ?? Number.MAX_SAFE_INTEGER) - (b.sequence_index ?? Number.MAX_SAFE_INTEGER)
      )

      const matchedDailySequence =
        normalizedRows.find((row) => row.sequence_index === dailySequenceIndex) ?? null
      const lowestSequenceRow = normalizedRows[0] ?? null
      const selectedRow = matchedDailySequence ?? lowestSequenceRow ?? data[0] ?? null

      const rawPractice = selectedRow?.practice
      const selected = Array.isArray(rawPractice) ? rawPractice[0] : rawPractice

      const nextPractice = selected
        ? {
            id: selected.id,
            title: selected.title,
            duration: selected.duration ?? undefined,
          }
        : null

      console.log("[EnergyCheck] recommendation pick", {
        feeling_slug: feelingSlug,
        support_mode_slug: selectedSupportMode,
        dailySequenceIndex,
        selected_sequence_index: selectedRow?.sequence_index ?? null,
        selected_practice_title: selected?.title ?? null,
      })

      setRecommendedPractice(nextPractice)
      setUsingCachedGuidance(false)
      setLoading(false)
      if (nextPractice) {
        void setOfflineCache(recommendationCacheKey, nextPractice)
      }

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
                      delayPressIn={ANDROID_SCROLL_PRESS_DELAY}
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
          {usingCachedGuidance ? (
            <ThemedText type="muted" style={styles.cachedNotice}>
              Offline mode - showing saved guidance.
            </ThemedText>
          ) : null}

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
                  accessibilityRole="button"
                  delayPressIn={ANDROID_SCROLL_PRESS_DELAY}
                  // NativeWind uses react-native-css-interop jsxImportSource; Pressable is wrapped so
                  // `className` maps to `style`. That wrapper can fail to pick up StyleSheet/Fast Refresh
                  // updates to `style` while children still update — opt into the raw RN Pressable.
                  // @ts-expect-error react-native-css-interop escape hatch (not on RN PressableProps)
                  cssInterop={false}
                  onPress={() => {
                    setSelectedSupportMode(mode.slug)
                  }}
                  android_ripple={
                    Platform.OS === "android"
                      ? { color: "rgba(255,255,255,0.14)" }
                      : undefined
                  }
                  style={({ pressed }) => [
                    styles.supportModeCard,
                    pressed && styles.supportModeCardPressed,
                  ]}
                >
                  <ThemedText
                    type="defaultSemiBold"
                    style={styles.supportModeLabel}
                  >
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
  cachedNotice: {
    marginTop: 8,
    fontSize: 11,
    textAlign: "center",
    opacity: 0.72,
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
    width: "100%",
    gap: 12,
    alignItems: "stretch",
  },

  supportModeCard: {
    width: "100%",
    minHeight: 74,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.17)",
    backgroundColor: "rgba(20, 40, 32, 0.44)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },

  supportModeCardPressed: {
    transform: [{ scale: 0.99 }],
    borderColor: "rgba(255,255,255,0.26)",
    backgroundColor: "rgba(28, 50, 40, 0.52)",
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },

  supportModeLabel: {
    fontSize: 16,
    letterSpacing: 0.2,
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "600",
    opacity: 0.95,
    lineHeight: 22,
    maxWidth: "100%",
    includeFontPadding: false,
    color: "rgba(255,255,255,0.95)",
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