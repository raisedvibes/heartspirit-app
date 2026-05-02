import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, View } from "react-native"
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useFonts } from "expo-font"
import { AlegreyaSans_400Regular, AlegreyaSans_500Medium } from "@expo-google-fonts/alegreya-sans"
import "react-native-reanimated"
import "../global.css"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { AuthProvider, useAuth } from "@/lib/auth"
import { registerPushToken } from "@/lib/pushTokenRegistration"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { playStartupAmbienceIfNeeded } from "@/lib/ambientSounds"
import IntroScreen from "@/components/IntroScreen"

export const unstable_settings = {
  anchor: "(tabs)",
}

/**
 * Play startup ambience only after auth is resolved and a user session exists.
 * Avoids firing expo-av during the cold start / login screen (often fails or is missed),
 * so first login matches "open app already signed in".
 */
function StartupAmbienceOnAuthenticated() {
  const { session, loading } = useAuth()
  const hasPlayedRef = useRef(false)

  useEffect(() => {
    if (loading) return

    if (!session?.user?.id) {
      hasPlayedRef.current = false
      return
    }

    if (hasPlayedRef.current) return
    hasPlayedRef.current = true
    playStartupAmbienceIfNeeded().catch(() => {})
  }, [loading, session?.user?.id])

  return null
}

function RootLayoutNav() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a1410" }}>
        <ActivityIndicator size="large" color="rgba(255,255,255,0.6)" />
      </View>
    )
  }

  const isAuthenticated = !!session

  return (
    <Stack>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
        <Stack.Screen name="support" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
        <Stack.Screen name="terms" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => {
    registerPushToken().catch(() => {})

    const supabase = getSupabaseClient()
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        registerPushToken().catch(() => {})
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const [fontsLoaded] = useFonts({
    AlegreyaSans_400Regular,
    AlegreyaSans_500Medium,
  })

  if (!fontsLoaded) return null

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <StartupAmbienceOnAuthenticated />
        <View style={{ flex: 1 }}>
          <RootLayoutNav />
          <StatusBar style="auto" />
          {showIntro ? <IntroScreen onFinish={() => setShowIntro(false)} /> : null}
        </View>
      </AuthProvider>
    </ThemeProvider>
  )
}
