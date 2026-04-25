import { View, StyleSheet } from "react-native"
import Animated from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ScreenContent, { getTabBarBottomPadding } from "@/components/layout/ScreenContent"
import { CirclesWidget } from "@/components/dashboard/Circles"
import { EnergyCheck } from "@/components/dashboard/EnergyCheck"
import { RitualsWidget } from "@/components/dashboard/RitualsWidget"
import BottomFade from "@/components/ui/BottomFade"
import { useCollapsibleTabHeader } from "@/hooks/useCollapsibleTabHeader"

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { animatedScreenOuterStyle, scrollHandler } = useCollapsibleTabHeader("home")

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

          <RitualsWidget />

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
