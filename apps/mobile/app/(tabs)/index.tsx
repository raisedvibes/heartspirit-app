import { useEffect, useState } from "react"
import { View, StyleSheet } from "react-native"
import Animated from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ScreenContent, { getTabBarBottomPadding } from "@/components/layout/ScreenContent"
import { CirclesWidget } from "@/components/dashboard/Circles"
import { EnergyCheck } from "@/components/dashboard/EnergyCheck"
import { RitualsWidget } from "@/components/dashboard/RitualsWidget"
import { WeeklyReflectionCard } from "@/components/dashboard/WeeklyReflectionCard"
import BottomFade from "@/components/ui/BottomFade"
import { useCollapsibleTabHeader } from "@/hooks/useCollapsibleTabHeader"
import { getSupabaseClient } from "@/lib/supabaseClient"

type WeeklyReflectionRow = {
  title: string | null
  reflection: string
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { animatedScreenOuterStyle, scrollHandler } = useCollapsibleTabHeader("home")
  const [weeklyReflection, setWeeklyReflection] = useState<WeeklyReflectionRow | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadWeeklyReflection() {
      const supabase = getSupabaseClient()
      if (!supabase) return

      const { data, error } = await supabase
        .from("weekly_reflections")
        .select("title, reflection")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return
      if (error || !data?.reflection?.trim()) {
        setWeeklyReflection(null)
        return
      }
      setWeeklyReflection(data as WeeklyReflectionRow)
    }

    loadWeeklyReflection()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <View style={styles.root}>
      <ScreenContent animatedOuterStyle={animatedScreenOuterStyle}>
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: getTabBarBottomPadding(insets), flexGrow: 1 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <EnergyCheck userName={undefined} />

          {weeklyReflection ? (
            <WeeklyReflectionCard
              title={weeklyReflection.title?.trim() || "This week"}
              reflection={weeklyReflection.reflection}
            />
          ) : null}

          <RitualsWidget ctaLabel="Manage" />

          <View style={styles.grid}>
            <CirclesWidget />
          </View>
        </Animated.ScrollView>
      </ScreenContent>
      <BottomFade />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: 16, paddingTop: 14 },
  grid: { gap: 14 },
})
