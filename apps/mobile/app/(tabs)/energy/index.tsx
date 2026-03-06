import { useMemo, useState } from "react"
import { View, StyleSheet, ImageBackground, ScrollView, Pressable } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ScreenContent, { getTabBarBottomPadding } from "@/components/layout/ScreenContent"
import TranslucentCard from "@/components/ui/TranslucentCard"
import { EnergyCheck } from "@/components/dashboard/EnergyCheck"
import { ThemedText } from "@/components/themed-text"
import BottomFade from "@/components/ui/BottomFade"

type SeasonKey = "Winter" | "Spring" | "Summer" | "Autumn"

function toLocalStartOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function getFallbackSeasonBoundaries(year: number) {
  return {
    spring: new Date(year, 2, 20, 0, 0, 0, 0),
    summer: new Date(year, 5, 20, 0, 0, 0, 0),
    autumn: new Date(year, 8, 22, 0, 0, 0, 0),
    winter: new Date(year, 11, 21, 0, 0, 0, 0),
  }
}

function computeSeason(
  today: Date,
  boundaries: { spring: Date; summer: Date; autumn: Date; winter: Date }
): SeasonKey {
  const t = toLocalStartOfDay(today)
  if (t >= boundaries.winter || t < boundaries.spring) return "Winter"
  if (t >= boundaries.spring && t < boundaries.summer) return "Spring"
  if (t >= boundaries.summer && t < boundaries.autumn) return "Summer"
  return "Autumn"
}

function ActionRow({
  title,
  subtitle,
  onPress,
}: {
  title: string
  subtitle?: string
  onPress?: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        pressed && styles.actionRowPressed,
      ]}
    >
      <ThemedText type="defaultSemiBold" style={styles.actionRowTitle}>
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText type="muted" style={styles.actionRowSubtitle}>
          {subtitle}
        </ThemedText>
      ) : null}
    </Pressable>
  )
}

export default function EnergyCheckScreen() {
  const insets = useSafeAreaInsets()
  const [userName] = useState<string | undefined>(undefined)

  const season = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const boundaries = getFallbackSeasonBoundaries(year)
    return computeSeason(now, boundaries)
  }, [])

  const todayPractices = useMemo(
    () => [
      { title: "Open the Portal", subtitle: "morning" },
      { title: "Hold the Frequency", subtitle: "mid-day" },
      { title: "Return to Source", subtitle: "evening" },
    ],
    []
  )

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
            contentContainerStyle={[styles.content, { paddingBottom: getTabBarBottomPadding(insets), flexGrow: 1 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerBlock}>
              <ThemedText type="title" style={styles.title}>
                Energy
              </ThemedText>
              <ThemedText type="muted" style={styles.subtitle}>
                check in with yourself
              </ThemedText>
            </View>

            <EnergyCheck userName={userName} />

            <TranslucentCard style={styles.card}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Today
              </ThemedText>
              <View style={styles.actionList}>
                {todayPractices.map((p) => (
                  <ActionRow
                    key={p.title}
                    title={p.title}
                    subtitle={p.subtitle}
                    onPress={() => console.log("[energy] today practice clicked:", p.title)}
                  />
                ))}
              </View>
            </TranslucentCard>

            <TranslucentCard style={styles.card}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                {season}
              </ThemedText>
              <View style={styles.actionList}>
                <ActionRow
                  title="Seasonal Practice (Placeholder)"
                  onPress={() => console.log("[energy] seasonal placeholder 1")}
                />
                <ActionRow
                  title="Seasonal Practice (Placeholder)"
                  onPress={() => console.log("[energy] seasonal placeholder 2")}
                />
              </View>
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
  content: { gap: 16 },
  headerBlock: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  title: { fontSize: 24, fontWeight: "600" },
  subtitle: { marginTop: 6 },
  card: { padding: 16 },
  sectionTitle: { fontSize: 16, marginBottom: 12 },
  actionList: { gap: 10 },
  actionRow: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  actionRowPressed: {
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  actionRowTitle: { fontSize: 14 },
  actionRowSubtitle: { fontSize: 12, marginTop: 4 },
})
