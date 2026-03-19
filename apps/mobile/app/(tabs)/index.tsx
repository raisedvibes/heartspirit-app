import { useEffect, useState } from "react"
import { View, StyleSheet, ImageBackground, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ScreenContent, { getTabBarBottomPadding } from "@/components/layout/ScreenContent"
import { CirclesWidget } from "@/components/dashboard/Circles"
import { EnergyCheck } from "@/components/dashboard/EnergyCheck"
import { RitualsWidget } from "@/components/dashboard/RitualsWidget"
import BottomFade from "@/components/ui/BottomFade"
import { getSupabaseClient } from "@/lib/supabaseClient"

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadBackground() {
      const supabase = getSupabaseClient()
      if (!supabase) return

      const { data, error } = await supabase
        .from("app_backgrounds")
        .select("image_url")
        .eq("page_key", "(tabs)/index")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle()

      if (!error && data?.image_url && isMounted) {
        setBackgroundUrl(data.image_url)
      }
    }

    loadBackground()

    return () => {
      isMounted = false
    }
  }, [])

  const backgroundSource = backgroundUrl
    ? { uri: backgroundUrl }
    : require("@/assets/images/fern.background.png")

  return (
    <View style={styles.root}>
      <ImageBackground
        source={backgroundSource}
        style={styles.bg}
        resizeMode="cover"
      >
        <ScreenContent>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: getTabBarBottomPadding(insets), flexGrow: 1 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <EnergyCheck userName={undefined} />

            <RitualsWidget />

            <View style={styles.grid}>
              <CirclesWidget />
            </View>
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
  grid: { gap: 14 },
})