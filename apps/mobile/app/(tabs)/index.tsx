import { useEffect, useState } from "react"
import { View, StyleSheet } from "react-native"
import Animated from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ScreenContent, { TAB_BAR_HEIGHT } from "@/components/layout/ScreenContent"
import { CirclesWidget } from "@/components/dashboard/Circles"
import { EnergyCheck } from "@/components/dashboard/EnergyCheck"
import {
  HomePromoCard,
  type HomePromoRow,
} from "@/components/dashboard/HomePromoCard"
import { RitualsWidget } from "@/components/dashboard/RitualsWidget"
import { WeeklyReflectionCard } from "@/components/dashboard/WeeklyReflectionCard"
import BottomFade from "@/components/ui/BottomFade"
import { useCollapsibleTabHeader } from "@/hooks/useCollapsibleTabHeader"
import { getSupabaseClient } from "@/lib/supabaseClient"

/** Extra scroll tail on Home only so the last card clears the tab dock with a bit more air than other tabs. */
const HOME_SCROLL_EXTRA_BOTTOM = 20

type WeeklyReflectionRow = {
  title: string | null
  reflection: string
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { animatedScreenOuterStyle, scrollHandler } = useCollapsibleTabHeader("home")
  const [weeklyReflection, setWeeklyReflection] = useState<WeeklyReflectionRow | null>(null)
  const [homePromo, setHomePromo] = useState<HomePromoRow | null>(null)

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

  useEffect(() => {
    let cancelled = false

    async function loadHomePromo() {
      const supabase = getSupabaseClient()
      if (!supabase) return

      const { data, error } = await supabase
        .from("home_promo_cards")
        .select("title, body, button_label, url")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return
      if (error || !data) {
        setHomePromo(null)
        return
      }
      setHomePromo(data as HomePromoRow)
    }

    loadHomePromo()

    return () => {
      cancelled = true
    }
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
            styles.content,
            {
              paddingBottom:
                TAB_BAR_HEIGHT + insets.bottom + 8 + HOME_SCROLL_EXTRA_BOTTOM,
              flexGrow: 1,
            },
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

          {homePromo ? <HomePromoCard promo={homePromo} /> : null}
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
