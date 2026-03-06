import { View, StyleSheet, ImageBackground, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ScreenContent, { getTabBarBottomPadding } from "@/components/layout/ScreenContent"
import { CirclesWidget } from "@/components/dashboard/Circles"
import { EnergyCheck } from "@/components/dashboard/EnergyCheck"
import { RitualsWidget } from "@/components/dashboard/RitualsWidget"
import BottomFade from "@/components/ui/BottomFade"

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
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
            {/* Section 1: Energy Check (top) */}
            <EnergyCheck userName={undefined} />

            {/* Section 2: Rituals mark-today widget */}
            <RitualsWidget />

            {/* Section 3: Grid (stacked vertically) */}
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
