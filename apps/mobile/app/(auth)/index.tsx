import { useEffect } from "react"
import type { ImageSourcePropType } from "react-native"
import { StyleSheet, ImageBackground, Pressable } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

import { useScreenBackground } from "@/hooks/useScreenBackground"

const INTRO_FALLBACK = require("@/assets/images/heartspirit-intro.png") as ImageSourcePropType

export default function AuthIndex() {
  const { source: backgroundSource, onError: onBackgroundError } = useScreenBackground(
    "(auth)/index",
    INTRO_FALLBACK
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(auth)/signup")
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleContinue = () => {
    router.replace("/(auth)/signup")
  }

  return (
    <Pressable style={styles.pressRoot} onPress={handleContinue}>
      <ImageBackground
        source={backgroundSource}
        style={styles.bg}
        resizeMode="cover"
        onError={onBackgroundError}
      >
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]} />
      </ImageBackground>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressRoot: { flex: 1, backgroundColor: "#0a1410" },
  bg: { flex: 1, backgroundColor: "#0a1410" },

  safe: {
    flex: 1,
  },
})