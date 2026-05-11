import { ImageBackground, StyleSheet, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Stack } from "expo-router"

const AUTH_SURFACE = "#0a1410"
const REDWOODS = require("@/assets/images/redwoods_trail1.png")

/**
 * Single full-bleed forest background for all auth routes; screens are transparent content only.
 * Solid underlay + image + gradient/readability overlay so Stack cards never show black between routes.
 */
export default function AuthLayout() {
  return (
    <View style={styles.shell}>
      <ImageBackground source={REDWOODS} style={styles.image} resizeMode="cover">
        <View style={styles.flatOverlay} pointerEvents="none" />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0.12)", "rgba(5, 10, 8, 0.38)"]}
          style={StyleSheet.absoluteFill}
        />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "none",
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
        </Stack>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: AUTH_SURFACE,
  },
  image: {
    flex: 1,
    backgroundColor: AUTH_SURFACE,
  },
  flatOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
})
