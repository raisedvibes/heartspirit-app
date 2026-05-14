import { router } from "expo-router"
import { View, StyleSheet, Pressable, Platform } from "react-native"
import TranslucentCard from "@/components/ui/TranslucentCard"
import { GLASS } from "@/components/ui/glass"
import { ThemedText } from "@/components/themed-text"
import {
  useRitualsStore,
  todayISO,
  nextMark,
  type Mark,
} from "../../lib/ritualsStore"
import { ANDROID_SCROLL_PRESS_DELAY } from "@/lib/androidScrollPress"

const MARK_LABEL: Record<Mark, string> = {
  empty: "",
  yes: "✓",
  no: "×",
  skip: "–",
}

function TodayToggle({
  ritualId,
  currentMark,
}: {
  ritualId: string
  currentMark: Mark
}) {
  const setMark = useRitualsStore((s) => s.setMark)
  const today = todayISO()

  const handlePress = () => {
    const next = nextMark(currentMark)
    setMark(ritualId, today, next)
  }

  return (
    <Pressable onPress={handlePress} style={styles.toggle}>
      <ThemedText type="defaultSemiBold" style={styles.toggleLabel}>
        {MARK_LABEL[currentMark] || "○"}
      </ThemedText>
    </Pressable>
  )
}

type RitualsWidgetProps = {
  /** Home card CTA; default matches previous copy for any other use. */
  ctaLabel?: string
}

export function RitualsWidget({ ctaLabel = "Add ritual" }: RitualsWidgetProps) {
  const rituals = useRitualsStore((s) => s.rituals)
  const today = todayISO()

  return (
    <TranslucentCard style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable
          delayPressIn={ANDROID_SCROLL_PRESS_DELAY}
          onPress={() => router.push("/rituals")}
          style={styles.header}
        >
          <ThemedText type="defaultSemiBold" style={styles.title}>
            Rituals
          </ThemedText>
        </Pressable>
        <Pressable
          delayPressIn={ANDROID_SCROLL_PRESS_DELAY}
          onPress={() => router.push("/rituals")}
          style={styles.addButton}
        >
          <ThemedText type="defaultSemiBold" style={styles.addButtonText}>
            {ctaLabel}
          </ThemedText>
        </Pressable>
      </View>
      {rituals.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
            No rituals yet
          </ThemedText>
          <ThemedText type="muted" style={styles.emptyBody}>
            Add a ritual.
          </ThemedText>
          <ThemedText type="muted" style={styles.emptyBody}>
            A ritual elevates a practice by intentionally connecting to heart.
          </ThemedText>
        </View>
      ) : (
      <View style={styles.listSection}>
        <ThemedText type="muted" style={styles.todayLabel}>
          Today
        </ThemedText>
        <View style={styles.list}>
        {rituals.map((r) => {
          const mark = (r.history?.[today] as Mark | undefined) ?? "empty"
          return (
            <View key={r.id} style={styles.row}>
              <View style={styles.ritualInfo}>
                <ThemedText type="defaultSemiBold" style={styles.ritualName}>
                  {r.name}
                </ThemedText>
                {r.tags?.length > 0 && (
                  <ThemedText type="muted" style={styles.tags}>
                    {r.tags.join(", ")}
                  </ThemedText>
                )}
              </View>
              <TodayToggle ritualId={r.id} currentMark={mark} />
            </View>
          )
        })}
        </View>
      </View>
      )}
    </TranslucentCard>
  )
}

const styles = StyleSheet.create({
  card: { padding: 14 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  header: { flex: 1 },
  title: { fontSize: 16 },
  addButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  addButtonText: { fontSize: 12, opacity: 0.9 },
  emptyState: { gap: 8 },
  emptyTitle: { fontSize: 16 },
  emptyBody: { fontSize: 14 },
  listSection: { gap: 6 },
  todayLabel: { fontSize: 13, opacity: 0.7 },
  list: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ritualInfo: { flex: 1 },
  ritualName: { fontSize: 14 },
  tags: { fontSize: 11, marginTop: 2, opacity: 0.8 },
  toggle: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: GLASS.borderDark,
    backgroundColor: GLASS.bgDark,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.22,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.86)",
    letterSpacing: 0.3,
  },
})
