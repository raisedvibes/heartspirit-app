import { View, StyleSheet, ImageBackground, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ScreenContent, { getTabBarBottomPadding } from "@/components/layout/ScreenContent"
import { CirclesWidget } from "@/components/dashboard/Circles"
import { EnergyCheck } from "@/components/dashboard/EnergyCheck"
import { RitualsWidget } from "@/components/dashboard/RitualsWidget"
import BottomFade from "@/components/ui/BottomFade"
import { useScreenBackground } from "@/hooks/useScreenBackground"

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { source, onError } = useScreenBackground("(tabs)/index")

  return (
    <View style={styles.root}>
      <ImageBackground
        source={source}
        style={styles.bg}
        resizeMode="cover"
        onError={onError}
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