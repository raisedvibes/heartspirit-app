import { useEffect } from "react"
import { View, StyleSheet, ImageBackground, Pressable } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { useScreenBackground } from "@/hooks/useScreenBackground"

export default function AuthIndex() {
  const { source: backgroundSource, onError: onBackgroundError } = useScreenBackground("(auth)/index")

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
    <Pressable style={{ flex: 1 }} onPress={handleContinue}>
      <ImageBackground
        source={backgroundSource}
        style={styles.bg}
        resizeMode="cover"
        onError={onBackgroundError}
      >
        <View style={styles.overlay} />
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.content}>
            <View style={styles.brandBlock}>
              <ThemedText style={styles.brand}>heartspirit</ThemedText>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  safe: {
    flex: 1,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  brandBlock: {
    alignItems: "center",
  },

  brand: {
    fontSize: 48,
    lineHeight: 58,
    fontFamily: "AlegreyaSans_500Medium",
    color: "#ffffff",
    letterSpacing: 0.4,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
})