import { useEffect, useState } from "react"
import { Stack, router, useLocalSearchParams } from "expo-router"
import { View, StyleSheet, ImageBackground, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import ScreenContent from "@/components/layout/ScreenContent"
import TranslucentCard from "@/components/ui/TranslucentCard"
import BottomFade from "@/components/ui/BottomFade"
import { ThemedText } from "@/components/themed-text"
import { getSupabaseClient } from "@/lib/supabaseClient"

type PracticeRecord = {
  id: string
  title: string
  short_summary: string | null
  description: string | null
  duration: number | null
  category: string | null
  instruction_bullets: string[] | null
  mantra: string | null
  timer_minutes: number | null
}

function splitTitleAndDescription(title: string) {
  const [main, ...rest] = title.split(" - ")
  return {
    mainTitle: main.trim(),
    titleDescription: rest.join(" - ").trim() || "",
  }
}

export default function PracticeDetailScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [practice, setPractice] = useState<PracticeRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadPractice() {
      if (!id || typeof id !== "string") {
        setLoading(false)
        return
      }

      const supabase = getSupabaseClient()
      if (!supabase) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("practices")
        .select(
          "id, title, short_summary, description, duration, category, instruction_bullets, mantra, timer_minutes"
        )
        .eq("id", id)
        .single()

      if (!cancelled) {
        if (error) {
          console.log("[practice] failed loading practice", error.message)
          setPractice(null)
        } else {
          setPractice(data)
        }
        setLoading(false)
      }
    }

    loadPractice()

    return () => {
      cancelled = true
    }
  }, [id])

  const titleParts = practice ? splitTitleAndDescription(practice.title) : null

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <ImageBackground
        source={require("@/assets/images/fern.background.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <ScreenContent>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topRow}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={22} color="rgba(255,255,255,0.9)" />
                <ThemedText type="defaultSemiBold" style={styles.backText}>
                  Back
                </ThemedText>
              </Pressable>

              <View style={styles.headerBlock}>
                <ThemedText type="title" style={styles.recommendedHeader}>
                  Recommended
                </ThemedText>
              </View>
            </View>

            <TranslucentCard style={styles.card}>
              {loading ? (
                <View style={styles.centerBlock}>
                  <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
                  <ThemedText type="muted" style={styles.statusText}>
                    Loading practice…
                  </ThemedText>
                </View>
              ) : !practice ? (
                <View style={styles.centerBlock}>
                  <ThemedText type="defaultSemiBold" style={styles.notFoundTitle}>
                    Practice not found
                  </ThemedText>
                  <ThemedText type="muted" style={styles.statusText}>
                    We couldn’t load this practice.
                  </ThemedText>
                </View>
              ) : (
                <>
                  <View style={styles.metaRow}>
                    {practice.category ? (
                      <View style={styles.pill}>
                        <ThemedText type="muted" style={styles.pillText}>
                          {practice.category}
                        </ThemedText>
                      </View>
                    ) : null}

                    {typeof practice.duration === "number" ? (
                      <ThemedText type="muted" style={styles.metaText}>
                        {practice.duration} min
                      </ThemedText>
                    ) : null}
                  </View>

                  <ThemedText type="title" style={styles.title}>
                    {titleParts?.mainTitle ?? practice.title}
                  </ThemedText>

                  {!!titleParts?.titleDescription && (
                    <ThemedText type="muted" style={styles.description}>
                      {titleParts.titleDescription}
                    </ThemedText>
                  )}

                  {!!practice.short_summary && (
                    <ThemedText type="muted" style={styles.description}>
                      {practice.short_summary}
                    </ThemedText>
                  )}

                  {!!practice.description && (
                    <ThemedText type="muted" style={styles.description}>
                      {practice.description}
                    </ThemedText>
                  )}

                  {practice.instruction_bullets && practice.instruction_bullets.length > 0 && (
                    <View style={styles.instructionsBlock}>
                      {practice.instruction_bullets.map((step, index) => (
                        <View key={`${index}-${step}`} style={styles.stepRow}>
                          <View style={styles.stepNumber}>
                            <ThemedText type="defaultSemiBold" style={styles.stepNumberText}>
                              {index + 1}
                            </ThemedText>
                          </View>
                          <ThemedText type="muted" style={styles.stepText}>
                            {step}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  )}

                  {!!practice.mantra && (
                    <View style={styles.mantraBlock}>
                      <ThemedText type="defaultSemiBold" style={styles.mantraLabel}>
                        Mantra
                      </ThemedText>
                      <ThemedText type="muted" style={styles.mantraText}>
                        {practice.mantra}
                      </ThemedText>
                    </View>
                  )}

                  {typeof practice.timer_minutes === "number" ? (
                    <View style={styles.timerRow}>
                      <ThemedText type="muted" style={styles.metaText}>
                        Timer: ~ {practice.timer_minutes} min
                      </ThemedText>
                    </View>
                  ) : null}
                </>
              )}
            </TranslucentCard>
          </ScrollView>
        </ScreenContent>
      </ImageBackground>

      <BottomFade />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1 },

  scrollContent: {
    gap: 16,
    paddingTop: 8,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  backText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
  },

  headerBlock: {
    alignItems: "flex-end",
  },

  recommendedHeader: {
    fontSize: 24,
    fontWeight: "600",
  },

  card: {
    padding: 18,
  },

  centerBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 10,
  },

  statusText: {
    fontSize: 14,
    textAlign: "center",
  },

  notFoundTitle: {
    fontSize: 18,
    textAlign: "center",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  pillText: {
    fontSize: 12,
  },

  metaText: {
    fontSize: 12,
  },

  title: {
    fontSize: 26,
    marginBottom: 10,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },

  instructionsBlock: {
    marginTop: 8,
    gap: 12,
  },

  stepRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  stepNumberText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.95)",
  },

  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  mantraBlock: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  mantraLabel: {
    fontSize: 13,
    marginBottom: 6,
  },

  mantraText: {
    fontSize: 14,
    lineHeight: 20,
  },

  timerRow: {
    marginTop: 16,
  },
})
