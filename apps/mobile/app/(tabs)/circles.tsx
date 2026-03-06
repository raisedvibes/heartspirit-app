import { useCallback, useEffect, useState } from "react"
import { View, StyleSheet, ImageBackground, ScrollView, Pressable, Linking, Alert } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useFocusEffect } from "expo-router"
import { Image } from "expo-image"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import type { SupabaseClient } from "@supabase/supabase-js"
import ScreenContent, { getTabBarBottomPadding } from "@/components/layout/ScreenContent"
import TranslucentCard from "@/components/ui/TranslucentCard"
import BottomFade from "@/components/ui/BottomFade"
import { ThemedText } from "@/components/themed-text"
import { getSupabaseClient } from "../../lib/supabaseClient"

type CircleRow = {
  id: string
  name: string
  description: string | null
  starts_at: string | null
  frequency: string
  image_url: string | null
  tags: string[] | null
  member_count: number | null
  payment_url: string | null
}

/** Format starts_at in local time for display. */
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

/** Normalize image_url to a loadable URL. Direct http(s) URLs pass through; storage paths use getPublicUrl. */
function getCircleImageUrl(imageUrl: string | null, supabase: SupabaseClient | null): string | null {
  const raw = imageUrl?.trim()
  if (!raw) return null
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw
  if (!supabase) return null
  // Supabase Storage: "circles/xyz.png" -> bucket circles, path xyz.png; "public/circles/xyz.png" -> bucket public, path circles/xyz.png
  const bucket = raw.startsWith("public/") ? "public" : raw.startsWith("circles/") ? "circles" : "public"
  const path = raw.startsWith("public/") ? raw.slice(7) : raw.startsWith("circles/") ? raw.slice(8) : raw
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data?.publicUrl ?? null
}

/** Renders circle image when URL is valid. Hides on load error. */
function CircleCardImage({
  imageUrl,
  supabase,
  style,
}: {
  imageUrl: string | null
  supabase: SupabaseClient | null
  style?: object
}) {
  const [errored, setErrored] = useState(false)
  const url = getCircleImageUrl(imageUrl, supabase)
  if (!url || errored) return null
  return (
    <Image
      source={{ uri: url }}
      style={[styles.circleImage, style]}
      contentFit="cover"
      onError={() => setErrored(true)}
    />
  )
}

export default function CirclesScreen() {
  const insets = useSafeAreaInsets()
  const [circles, setCircles] = useState<CircleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const fetchCircles = useCallback(async () => {
    const supabase = getSupabaseClient()
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
      setCircles((data ?? []) as CircleRow[])
    }
    setLoading(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchCircles()
    }, [fetchCircles])
  )

  useEffect(() => {
    const supabase = getSupabaseClient()
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
  }, [fetchCircles])

  const hasCircles = circles.length > 0

  const handleJoin = (circle: CircleRow) => {
    const url = circle.payment_url?.trim()
    if (!url) {
      Alert.alert(
        "Join link not set",
        "Join link not set yet for this circle. Please check back soon."
      )
      return
    }
    Linking.openURL(url)
  }

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require("@/assets/images/fern.background.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <ScreenContent>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: getTabBarBottomPadding(insets) }]}
            showsVerticalScrollIndicator={false}
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
                  <TranslucentCard key={circle.id} style={styles.circleCard}>
                    <CircleCardImage
                      imageUrl={circle.image_url}
                      supabase={getSupabaseClient()}
                      style={styles.circleImage}
                    />
                    <ThemedText type="defaultSemiBold" style={styles.circleName}>
                      {circle.name}
                    </ThemedText>
                    {(formatStartsAt(circle.starts_at) || circle.frequency) && (
                      <ThemedText type="muted" style={styles.dateLine}>
                        {[formatStartsAt(circle.starts_at), circle.frequency].filter(Boolean).join(" • ")}
                      </ThemedText>
                    )}
                    {circle.description ? (
                      <ThemedText type="muted" style={styles.circleDescription}>
                        {circle.description}
                      </ThemedText>
                    ) : null}
                    {circle.tags && circle.tags.length > 0 && (
                      <View style={styles.tagsRow}>
                        {circle.tags.map((tag, i) => (
                          <View key={i} style={styles.tag}>
                            <ThemedText type="muted" style={styles.tagText}>
                              {tag}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    )}
                    <Pressable
                      style={styles.reserveButton}
                      onPress={() => handleJoin(circle)}
                    >
                      <ThemedText type="defaultSemiBold" style={styles.reserveButtonText}>
                        Reserve
                      </ThemedText>
                    </Pressable>
                  </TranslucentCard>
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
  scrollContent: { gap: 16, paddingTop: 8 },
  headerBlock: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  title: { fontSize: 24, fontWeight: "600" },
  subtitle: { marginTop: 6 },
  statusText: { fontSize: 14, marginTop: 16 },
  errorBlock: { marginTop: 16 },
  errorTitle: { fontSize: 14 },
  errorBody: { fontSize: 14, marginTop: 4 },
  grid: { marginTop: 16, gap: 16 },
  circleCard: {
    padding: 16,
  },
  circleImage: {
    height: 140,
    width: "100%",
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 12,
    borderRadius: 12,
  },
  circleName: { fontSize: 18, marginBottom: 8 },
  dateLine: { fontSize: 12, marginBottom: 6 },
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
  tagText: { fontSize: 12 },
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
  reserveButtonText: { fontSize: 14 },
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
  emptyTitle: { fontSize: 18, marginBottom: 8 },
  emptyBody: { fontSize: 14 },
})
