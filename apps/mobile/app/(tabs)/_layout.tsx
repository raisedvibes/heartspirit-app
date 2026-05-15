import { BottomTabBar } from "@react-navigation/bottom-tabs"
import { Tabs } from "expo-router"
import React from "react"
import { Platform, View, Pressable, StyleSheet, ImageBackground } from "react-native"
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import {
  HOME_HEADER_SCROLL_RANGE,
  TabHeaderScrollProvider,
  useTabHeaderScroll,
} from "@/contexts/TabHeaderScrollContext"
import { ThemedText } from "@/components/themed-text"
import { IconSymbol } from "@/components/ui/icon-symbol"

const HOME_LOGO_TRANSLATE_UP = -14
const IS_ANDROID = Platform.OS === "android"

export default function TabLayout() {
  return (
    <TabHeaderScrollProvider>
      <TabLayoutContent />
    </TabHeaderScrollProvider>
  )
}

function TabLayoutContent() {
  const insets = useSafeAreaInsets()
  const { scrollY, activeDriverId } = useTabHeaderScroll()

  const brandAnimatedStyle = useAnimatedStyle(() => {
    if (!activeDriverId.value) {
      return {
        opacity: 0.95,
        transform: [{ translateY: 0 }],
      }
    }
    const y = Math.min(Math.max(scrollY.value, 0), HOME_HEADER_SCROLL_RANGE)
    const t = interpolate(y, [0, HOME_HEADER_SCROLL_RANGE], [0, 1], Extrapolation.CLAMP)
    const logoY = interpolate(t, [0, 1], [0, HOME_LOGO_TRANSLATE_UP], Extrapolation.CLAMP)
    return {
      opacity: interpolate(t, [0, 1], [0.95, 0]),
      transform: [
        { translateY: IS_ANDROID ? Math.round(logoY) : logoY },
      ],
    }
  })

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require("@/assets/images/fern_background.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        pointerEvents="none"
      />
      <View
          style={[
            styles.overlayHeader,
            { paddingTop: insets.top + (Platform.OS === "android" ? 14 : 6) },
          ]}
          pointerEvents="box-none"
        >
          <Animated.View style={brandAnimatedStyle}>
            <Pressable style={styles.brand} onPress={() => {}}>
              <ThemedText
                type="title"
                style={[styles.brandText, { fontFamily: "AlegreyaSans_500Medium" }]}
              >
                heartspirit
              </ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      <Tabs
          tabBar={(props) => (
            <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
              <BottomTabBar {...props} />
            </View>
          )}
          screenOptions={{
            sceneStyle: {
              backgroundColor: "transparent",
            },
            contentStyle: {
              backgroundColor: "transparent",
            },
            tabBarActiveTintColor: "rgba(255,255,255,0.92)",
            tabBarInactiveTintColor: "rgba(255,255,255,0.45)",
            tabBarStyle: {
              backgroundColor: "#020806",
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.10)",
              height: 56 + insets.bottom,
              paddingBottom: insets.bottom,
              ...(Platform.OS === "android" && { elevation: 0 }),
            },
            headerShown: false,
            // tabBarButton: HapticTab,
          }}
        >
        {/* 1) Home */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol
  name="home"
  size={24}
  color={color}
/>
            ),
          }}
        />

        {/* 2) Energy */}
        <Tabs.Screen
          name="energy/index"
          options={{
            title: "Energy",
            tabBarIcon: ({ color }) => (
              <IconSymbol
                name="bolt"
                size={24}
                color={color}
              />
            ),
          }}
        />

        {/* 3) Rituals */}
        <Tabs.Screen
          name="rituals"
          options={{
            title: "Rituals",
            tabBarIcon: ({ color }) => (
              <IconSymbol
                name="sparkles"
                size={24}
                color={color}
              />
            ),
          }}
        />

        {/* 4) Circles */}
        <Tabs.Screen
          name="circles"
          options={{
            title: "Circles",
            tabBarIcon: ({ color }) => (
              <IconSymbol
                name="people-outline"
                size={24}
                color={color}
              />
            ),
          }}
        />

        {/* 5) Settings */}
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <IconSymbol
                name="gearshape"
                size={24}
                color={color}
              />
            ),
          }}
        />

        {/* Hidden routes (keep if used internally) */}
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>
    </View>
  )
}


const styles = StyleSheet.create({
  overlayHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 50,
  },
  brand: { alignSelf: "flex-start" },
  brandText: {
    fontSize: 26,
    fontWeight: "normal",
    letterSpacing: 0.2,
  },
})
