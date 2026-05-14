import { useCallback, useEffect, useState } from "react"
import { router } from "expo-router"
import { useFocusEffect } from "expo-router"
import {
  Pressable,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native"
import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"
import { getSupabaseClient } from "../../lib/supabaseClient"
import { ANDROID_SCROLL_PRESS_DELAY } from "@/lib/androidScrollPress"

type NextCircle = {
  id: string
  name: string
  description: string | null
  starts_at: string | null
  frequency: "Weekly" | "Monthly"
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

/*
 * RLS migration (if circles table has RLS enabled and anon cannot SELECT):
 *
 * -- Allow anon and authenticated to read published circles
 * CREATE POLICY "Allow read published circles"
 *   ON public.circles
 *   FOR SELECT
 *   TO anon, authenticated
 *   USING (is_published = true);
 */

export function CirclesWidget() {
  const [nextCircle, setNextCircle] = useState<NextCircle | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchNextCircle = useCallback(async () => {
    const supabase = getSupabaseClient()

    if (__DEV__) {
      console.log("[CirclesWidget] Supabase client:", supabase ? "ok" : "null")
    }

    if (!supabase) {
      setNextCircle(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from("circles")
      .select("id, name, description, starts_at, frequency")
      .eq("is_published", true)
      .not("starts_at", "is", null)
      .gte("starts_at", now)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (__DEV__) {
      console.log("[CirclesWidget] Query result:", { data, error: error?.message })
    }

    if (error) {
      setNextCircle(null)
    } else {
      setNextCircle((data ?? null) as NextCircle | null)
    }

    setLoading(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchNextCircle()
    }, [fetchNextCircle])
  )

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    const channel = supabase
      .channel("circles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "circles" },
        () => {
          fetchNextCircle()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchNextCircle])

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
          <ThemedText type="muted" style={styles.cardBody}>
            Loading upcoming circle…
          </ThemedText>
        </View>
      )
    }

    if (nextCircle) {
      const dateFreq = formatStartsAt(nextCircle.starts_at)
      return (
        <>
          <View>
            <ThemedText type="defaultSemiBold" style={styles.nextTitle}>
              Next: {nextCircle.name}
            </ThemedText>
            {dateFreq && (
              <ThemedText type="muted" style={styles.dateLine}>
                {dateFreq} • {nextCircle.frequency ?? ""}
              </ThemedText>
            )}
          </View>
          <View style={styles.footerRow}>
            <Pressable
              delayPressIn={ANDROID_SCROLL_PRESS_DELAY}
              onPress={() => router.push("/circles")}
              style={styles.addButton}
            >
              <ThemedText type="defaultSemiBold" style={styles.addButtonText}>
                Learn more
              </ThemedText>
            </Pressable>
          </View>
        </>
      )
    }

    return (
      <>
        <ThemedText type="muted" style={styles.cardBody}>
          No upcoming circles scheduled.
        </ThemedText>
        <View style={styles.footerRow}>
          <Pressable
            delayPressIn={ANDROID_SCROLL_PRESS_DELAY}
            onPress={() => router.push("/circles")}
            style={styles.addButton}
          >
            <ThemedText type="defaultSemiBold" style={styles.addButtonText}>
              Learn more
            </ThemedText>
          </Pressable>
        </View>
      </>
    )
  }

  return (
    <Pressable delayPressIn={ANDROID_SCROLL_PRESS_DELAY} onPress={() => router.push("/circles")}>
      <TranslucentCard style={styles.cardWrapper}>
        <View style={styles.cardInner}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Circles
          </ThemedText>
          {renderBody()}
        </View>
      </TranslucentCard>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  cardWrapper: { flex: 1 },
  cardInner: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 16 },
  cardBody: { marginTop: 6 },
  dateLine: { fontSize: 12, marginTop: 4 },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  nextTitle: { fontSize: 14, marginTop: 6 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  addButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  addButtonText: { fontSize: 12, opacity: 0.9 },
})
