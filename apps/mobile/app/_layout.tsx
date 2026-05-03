import { useEffect, useState } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from "@react-navigation/native"
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
import * as SystemUI from "expo-system-ui"

import { startRootAmbientPlayback, stopRootAmbientPlayback } from "@/lib/ambientSounds"
import IntroScreen from "@/components/IntroScreen"

const APP_SURFACE = "#0a1410"

function appNavigationTheme(colorScheme: string | null | undefined): Theme {
  const base = colorScheme === "dark" ? DarkTheme : DefaultTheme
  return {
    ...base,
    colors: {
      ...base.colors,
      background: APP_SURFACE,
      card: APP_SURFACE,
    },
  }
}

export const unstable_settings = {
  anchor: "(tabs)",
}

/** Session ambient at root — not gated on auth (plays through intro + auth + tabs until teardown). */
function RootSessionAmbient() {
  useEffect(() => {
    startRootAmbientPlayback().catch((e) => {
      console.warn("[audio] root session ambient failed:", e)
    })
    return () => {
      stopRootAmbientPlayback().catch((e) => {
        console.warn("[audio] root session ambient stop failed:", e)
      })
    }
  }, [])

  return null
}

function RootLayoutNav() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: APP_SURFACE }}>
        <ActivityIndicator size="large" color="rgba(255,255,255,0.6)" />
      </View>
    )
  }

  const isAuthenticated = !!session

  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: APP_SURFACE } }}>
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
  const navTheme = appNavigationTheme(colorScheme)

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

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(APP_SURFACE).catch((e) => {
      console.warn("[system-ui] setBackgroundColorAsync failed", e)
    })
  }, [])

  const [fontsLoaded] = useFonts({
    AlegreyaSans_400Regular,
    AlegreyaSans_500Medium,
  })

  if (!fontsLoaded) {
    return (
      <ThemeProvider value={navTheme}>
        <View style={{ flex: 1, backgroundColor: APP_SURFACE }} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider value={navTheme}>
      <RootSessionAmbient />
      <AuthProvider>
        <View style={{ flex: 1, backgroundColor: APP_SURFACE }}>
          <RootLayoutNav />
          <StatusBar style="auto" />
          {showIntro ? (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { backgroundColor: APP_SURFACE, zIndex: 999 }]}
            />
          ) : null}
          {showIntro ? <IntroScreen onFinish={() => setShowIntro(false)} /> : null}
        </View>
      </AuthProvider>
    </ThemeProvider>
  )
}
