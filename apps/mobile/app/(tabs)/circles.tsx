import { useCallback, useEffect, useRef, useState } from "react"
import { View, StyleSheet, Pressable, Linking, Alert } from "react-native"
import Animated from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useFocusEffect } from "expo-router"
import { Image } from "expo-image"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import type { SupabaseClient } from "@supabase/supabase-js"
import ScreenContent, { TAB_BAR_HEIGHT } from "@/components/layout/ScreenContent"
import { useCollapsibleTabHeader } from "@/hooks/useCollapsibleTabHeader"
import TranslucentCard from "@/components/ui/TranslucentCard"
import BottomFade from "@/components/ui/BottomFade"
import { GLASS } from "@/components/ui/glass"
import { ThemedText } from "@/components/themed-text"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { NotificationPermissionModal } from "@/components/notifications/NotificationPermissionModal"
import {
  enableNotificationsFromPrompt,
  isNotificationPermissionGranted,
  markCirclesSoftPromptShownThisSession,
  STAY_IN_RHYTHM_PROMPT,
  wasCirclesSoftPromptShownThisSession,
} from "@/lib/notificationPermissionPrompt"

const CIRCLES_NOTIF_PROMPT_DELAY_MS = 900

type CircleRow = {
  id: string
  name: string
  description: string | null
  starts_at: string | null
  frequency: string
  image_url: string | null
  tags: string[] | null
  member_count: number | null
  join_url: string | null
}

function formatStartsAt(startsAt: string | null): string {
  if (!startsAt) return ""
  try {
    const d = new Date(startsAt)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}

function getCircleImageUrl(imageUrl: string | null, supabase: SupabaseClient | null): string | null {
  const raw = imageUrl?.trim()
  if (!raw) return null
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw
  if (!supabase) return null

  const bucket = raw.startsWith("public/")
    ? "public"
    : raw.startsWith("circles/")
      ? "circles"
      : "public"

  const path = raw.startsWith("public/")
    ? raw.slice(7)
    : raw.startsWith("circles/")
      ? raw.slice(8)
      : raw

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data?.publicUrl ?? null
}

function CircleCardImage({
  imageUrl,
  supabase,
}: {
  imageUrl: string | null
  supabase: SupabaseClient | null
}) {
  const [errored, setErrored] = useState(false)
  const url = getCircleImageUrl(imageUrl, supabase)

  if (!url || errored) return null

  return (
    <View style={styles.circleImageWrap}>
      <Image
        source={{ uri: url }}
        style={styles.circleImage}
        contentFit="cover"
        transition={120}
        onError={() => setErrored(true)}
      />
    </View>
  )
}

export default function CirclesScreen() {
  const insets = useSafeAreaInsets()
  const { animatedScreenOuterStyle, scrollHandler } = useCollapsibleTabHeader("circles")
  const supabase = getSupabaseClient()

  const [circles, setCircles] = useState<CircleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notifPromptSource, setNotifPromptSource] = useState<"tab" | "reserve" | null>(null)
  const pendingReserveCircleRef = useRef<CircleRow | null>(null)

  const fetchCircles = useCallback(async () => {
    if (!supabase) {
      setLoadError("Not configured")
      setCircles([])
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)

    const { data, error } = await supabase
      .from("circles")
      .select("id, name, description, starts_at, frequency, image_url, tags, member_count, payment_url")
      .eq("is_published", true)
      .order("starts_at", { ascending: true, nullsFirst: false })

    if (error) {
      setLoadError(error.message)
      setCircles([])
    } else {
      const rows = (data ?? []) as Record<string, unknown>[]
      setCircles(
        rows.map(({ payment_url, ...rest }) => ({
          ...(rest as Omit<CircleRow, "join_url">),
          join_url: typeof payment_url === "string" ? payment_url : null,
        }))
      )
    }

    setLoading(false)
  }, [supabase])

  useFocusEffect(
    useCallback(() => {
      fetchCircles()

      let cancelled = false
      const timer = setTimeout(async () => {
        if (cancelled || wasCirclesSoftPromptShownThisSession()) return
        const granted = await isNotificationPermissionGranted()
        if (cancelled || granted) return
        markCirclesSoftPromptShownThisSession()
        setNotifPromptSource("tab")
      }, CIRCLES_NOTIF_PROMPT_DELAY_MS)

      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    }, [fetchCircles])
  )

  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel("circles-list-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "circles" },
        () => {
          fetchCircles()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchCircles])

  const hasCircles = circles.length > 0

  const openReserveUrl = useCallback((circle: CircleRow) => {
    const url = circle.join_url?.trim()
    if (!url) {
      Alert.alert(
        "Circle link not set",
        "A circle link hasn’t been added yet for this circle. Please check back soon."
      )
      return
    }

    Linking.openURL(url)
  }, [])

  const handleReservePress = useCallback(
    async (circle: CircleRow) => {
      const url = circle.join_url?.trim()
      if (!url) {
        Alert.alert(
          "Circle link not set",
          "A circle link hasn’t been added yet for this circle. Please check back soon."
        )
        return
      }

      if (await isNotificationPermissionGranted()) {
        Linking.openURL(url)
        return
      }

      pendingReserveCircleRef.current = circle
      setNotifPromptSource("reserve")
    },
    []
  )

  const dismissNotifPrompt = useCallback(() => {
    setNotifPromptSource(null)
  }, [])

  return (
    <View style={styles.root}>
      <ScreenContent
        animatedOuterStyle={animatedScreenOuterStyle}
        bottomPaddingOverride={0}
      >
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 8 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <View style={styles.headerBlock}>
            <ThemedText type="title" style={styles.title}>
              Circles
            </ThemedText>
            <ThemedText type="muted" style={styles.subtitle}>
              create space together
            </ThemedText>
          </View>

            {loading ? (
              <ThemedText type="muted" style={styles.statusText}>
                Loading circles…
              </ThemedText>
            ) : loadError ? (
              <View style={styles.errorBlock}>
                <ThemedText type="defaultSemiBold" style={styles.errorTitle}>
                  Couldn't load circles
                </ThemedText>
                <ThemedText type="muted" style={styles.errorBody}>
                  {loadError}
                </ThemedText>
              </View>
            ) : hasCircles ? (
              <View style={styles.grid}>
                {circles.map((circle) => (
                  <View key={circle.id} style={styles.circleCard}>
                    <CircleCardImage imageUrl={circle.image_url} supabase={supabase} />

                    <View style={styles.circleCardBody}>
                      <ThemedText type="defaultSemiBold" style={styles.circleName}>
                        {circle.name}
                      </ThemedText>

                      {(formatStartsAt(circle.starts_at) || circle.frequency) && (
                        <ThemedText type="muted" style={styles.dateLine}>
                          {[formatStartsAt(circle.starts_at), circle.frequency]
                            .filter(Boolean)
                            .join(" • ")}
                        </ThemedText>
                      )}

                      {circle.description ? (
                        <ThemedText type="muted" style={styles.circleDescription}>
                          {circle.description}
                        </ThemedText>
                      ) : null}

                      {circle.tags && circle.tags.length > 0 ? (
                        <View style={styles.tagsRow}>
                          {circle.tags.map((tag, i) => (
                            <View key={i} style={styles.tag}>
                              <ThemedText type="muted" style={styles.tagText}>
                                {tag}
                              </ThemedText>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      <Pressable
                        style={styles.reserveButton}
                        onPress={() => void handleReservePress(circle)}
                      >
                        <ThemedText type="defaultSemiBold" style={styles.reserveButtonText}>
                          Reserve
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <MaterialIcons name="people" size={32} color="rgba(255,255,255,0.8)" />
                </View>
                <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                  No circles found
                </ThemedText>
                <ThemedText type="muted" style={styles.emptyBody}>
                  No circles yet. Check back soon.
                </ThemedText>
              </View>
            )}
        </Animated.ScrollView>
      </ScreenContent>

      <NotificationPermissionModal
        visible={notifPromptSource !== null}
        title={STAY_IN_RHYTHM_PROMPT.title}
        body={STAY_IN_RHYTHM_PROMPT.body}
        primaryLabel={STAY_IN_RHYTHM_PROMPT.primaryLabel}
        secondaryLabel={STAY_IN_RHYTHM_PROMPT.secondaryLabel}
        onPrimary={() => {
          const source = notifPromptSource
          const pending = pendingReserveCircleRef.current
          dismissNotifPrompt()
          pendingReserveCircleRef.current = null
          void (async () => {
            await enableNotificationsFromPrompt()
            if (source === "reserve" && pending) {
              openReserveUrl(pending)
            }
          })()
        }}
        onSecondary={() => {
          const source = notifPromptSource
          const pending = pendingReserveCircleRef.current
          dismissNotifPrompt()
          pendingReserveCircleRef.current = null
          if (source === "reserve" && pending) {
            openReserveUrl(pending)
          }
        }}
        onRequestClose={dismissNotifPrompt}
      />

      <BottomFade />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  scrollContent: {
    gap: 16,
  },

  headerBlock: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },

  title: {
    fontSize: 24,
    fontWeight: "600",
  },

  subtitle: {
    marginTop: 6,
  },

  statusText: {
    fontSize: 14,
    marginTop: 16,
  },

  errorBlock: {
    marginTop: 16,
  },

  errorTitle: {
    fontSize: 14,
  },

  errorBody: {
    fontSize: 14,
    marginTop: 4,
  },

  grid: {
    marginTop: 16,
    gap: 16,
  },

  circleCard: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: GLASS.bgDark,
    borderWidth: 1,
    borderColor: GLASS.borderDark,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    backdropFilter: "blur(12px)",
  },

  circleImageWrap: {
    width: "100%",
    height: 148,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  circleImage: {
    width: "100%",
    height: "100%",
  },

  circleCardBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },

  circleName: {
    fontSize: 18,
    marginBottom: 8,
  },

  dateLine: {
    fontSize: 12,
    marginBottom: 6,
  },

  circleDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  tagText: {
    fontSize: 12,
  },

  reserveButton: {
    alignSelf: "flex-end",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  reserveButtonText: {
    fontSize: 14,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    marginTop: 16,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    marginBottom: 8,
  },

  emptyBody: {
    fontSize: 14,
  },
})