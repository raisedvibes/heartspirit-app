import { useCallback, useState } from "react"
import { useFocusEffect } from "expo-router"
import { View, StyleSheet, ImageBackground, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ScreenContent, { getTabBarBottomPadding } from "@/components/layout/ScreenContent"
import { CirclesWidget } from "@/components/dashboard/Circles"
import { EnergyCheck } from "@/components/dashboard/EnergyCheck"
import { RitualsWidget } from "@/components/dashboard/RitualsWidget"
import BottomFade from "@/components/ui/BottomFade"
import { useAuth } from "@/lib/auth"
import { getSupabaseClient } from "@/lib/supabaseClient"

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [userName, setUserName] = useState<string | undefined>(undefined)

  useFocusEffect(
    useCallback(() => {
      let cancelled = false

      async function loadProfileName() {
        if (!user?.id) {
          setUserName(undefined)
          return
        }

        const supabase = getSupabaseClient()
        if (!supabase) {
          setUserName(undefined)
          return
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single()

        if (!cancelled) {
          if (error) {
            console.log("[dashboard] failed loading display_name", error.message)
            setUserName(undefined)
          } else {
            setUserName(data?.display_name ?? undefined)
          }
        }
      }

      loadProfileName()

      return () => {
        cancelled = true
      }
    }, [user?.id])
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
            contentContainerStyle={[
              styles.content,
              { paddingBottom: getTabBarBottomPadding(insets), flexGrow: 1 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <EnergyCheck userName={userName} />

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
