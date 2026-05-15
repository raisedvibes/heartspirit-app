import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, Image, View } from "react-native"
import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from "@react-navigation/native"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useFonts } from "expo-font"
import { AlegreyaSans_400Regular, AlegreyaSans_500Medium } from "@expo-google-fonts/alegreya-sans"
import * as SplashScreen from "expo-splash-screen"
import "react-native-reanimated"
import "../global.css"

import { useColorScheme } from "@/hooks/use-color-scheme"
import { AuthProvider, useAuth } from "@/lib/auth"
import { PushTokenSync } from "@/components/PushTokenSync"
import { NotificationTapHandler } from "@/lib/notificationTapRouting"
import * as SystemUI from "expo-system-ui"

import {
  fadeOutRootAmbientPlayback,
  startRootAmbientPlayback,
  stopRootAmbientPlayback,
} from "@/lib/ambientSounds"
import IntroScreen from "@/components/IntroScreen"

void SplashScreen.preventAutoHideAsync()

const APP_SURFACE = "#0a1410"
const INTRO_BG = require("@/assets/images/redwoods_trail1.png")

/** Guest / first-time auth entry — full intro length. */
const INTRO_TOTAL_MS_GUEST = 5500
/** Session already present — shorter path into tabs. */
const INTRO_TOTAL_MS_RETURNING = 3100

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

/** Session ambient at root — not gated on auth (plays through intro + auth until fade). */
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

/** After intro ends and user is signed in, fade forest ambience out (not on tabs). */
function AmbientFadeAfterAppEntry({ showIntro }: { showIntro: boolean }) {
  const { session, loading } = useAuth()
  const fadedRef = useRef(false)

  useEffect(() => {
    if (loading || showIntro) return
    if (!session) {
      fadedRef.current = false
      return
    }
    if (fadedRef.current) return
    fadedRef.current = true
    fadeOutRootAmbientPlayback(2200).catch((e) => {
      console.warn("[audio] fade-out failed:", e)
    })
  }, [loading, session, showIntro])

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
    <>
      {isAuthenticated ? <NotificationTapHandler /> : null}
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
    </>
  )
}

function RootAppShell() {
  const [showIntro, setShowIntro] = useState(true)
  const { session, loading } = useAuth()
  const splashHiddenRef = useRef(false)

  useEffect(() => {
    if (loading || !showIntro || splashHiddenRef.current) return

    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (splashHiddenRef.current) return
        splashHiddenRef.current = true
        SplashScreen.hideAsync().catch(() => {})
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      if (raf2) cancelAnimationFrame(raf2)
    }
  }, [loading, showIntro])

  const introTotalMs = session ? INTRO_TOTAL_MS_RETURNING : INTRO_TOTAL_MS_GUEST

  return (
    <>
      <RootSessionAmbient />
      <AmbientFadeAfterAppEntry showIntro={showIntro} />
      <View style={{ flex: 1, backgroundColor: APP_SURFACE }}>
        <RootLayoutNav />
        <StatusBar style="auto" />
        {!loading && showIntro ? (
          <IntroScreen totalDurationMs={introTotalMs} onFinish={() => setShowIntro(false)} />
        ) : null}
      </View>
    </>
  )
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [introImageReady, setIntroImageReady] = useState(false)
  const navTheme = appNavigationTheme(colorScheme)

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(APP_SURFACE).catch((e) => {
      console.warn("[system-ui] setBackgroundColorAsync failed", e)
    })
  }, [])

  const [fontsLoaded] = useFonts({
    AlegreyaSans_400Regular,
    AlegreyaSans_500Medium,
  })

  useEffect(() => {
    if (!fontsLoaded) return

    let cancelled = false

    ;(async () => {
      try {
        const src = Image.resolveAssetSource(INTRO_BG)
        if (src?.uri) {
          await Image.prefetch(src.uri)
        }
      } catch {
        // Still allow intro to mount; ImageBackground may load from disk.
      }
      if (!cancelled) setIntroImageReady(true)
    })()

    return () => {
      cancelled = true
    }
  }, [fontsLoaded])

  if (!fontsLoaded || !introImageReady) {
    return (
      <ThemeProvider value={navTheme}>
        <View style={{ flex: 1, backgroundColor: APP_SURFACE }} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider value={navTheme}>
      <AuthProvider>
        <PushTokenSync />
        <RootAppShell />
      </AuthProvider>
    </ThemeProvider>
  )
}
