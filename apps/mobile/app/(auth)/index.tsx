import { useEffect, useState } from "react"
import { View, StyleSheet, ImageBackground, Pressable } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

import { ThemedText } from "@/components/themed-text"
import { getSupabaseClient } from "@/lib/supabaseClient"

export default function AuthIndex() {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadBackground() {
      const supabase = getSupabaseClient()
      if (!supabase) return

      const { data, error } = await supabase
        .from("app_backgrounds")
        .select("https://dddhogjwllfurcvhjseh.supabase.co/storage/v1/object/public/app-assets/fern.background.png")
        .eq("page_key", "(auth)/index")
        .eq("is_active", true)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error && data?.image_url && isMounted) {
        setBackgroundUrl(data.image_url)
      }
    }

    loadBackground()

    const timer = setTimeout(() => {
      router.replace("/(auth)/signup")
    }, 3000)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [])

  const handleContinue = () => {
    router.replace("/(auth)/signup")
  }

  const backgroundSource = backgroundUrl
    ? { uri: backgroundUrl }
    : require("@/assets/images/fern.background.png")

  return (
    <Pressable style={{ flex: 1 }} onPress={handleContinue}>
      <ImageBackground
  source={backgroundSource}
  style={styles.bg}
  resizeMode="cover"
  onError={() => {
    console.log("[energy] background failed, using fallback")
    setBackgroundUrl(null)
  }}
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
  root: {
    flex: 1,
  },

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