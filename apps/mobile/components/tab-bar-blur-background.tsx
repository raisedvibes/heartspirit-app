import React from "react"
import { NativeModules, Platform, StyleSheet, View } from "react-native"

const OVERLAY_COLOR = "rgba(6,24,20,0.35)"

function hasNativeExpoBlur(): boolean {
  if (Platform.OS === "web") return false
  const nm: Record<string, unknown> = NativeModules
  return Boolean(nm?.ExpoBlurView || nm?.ExpoBlurViewModule)
}

let BlurView: React.ComponentType<{ intensity?: number; tint?: string; style?: object }> | null = null
if (hasNativeExpoBlur()) {
  try {
    BlurView = require("expo-blur").BlurView
  } catch {
    BlurView = null
  }
}

export function TabBarBlurBackground() {
  if (!BlurView) {
    return (
      <View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: OVERLAY_COLOR }]}
      />
    )
  }

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <BlurView
        intensity={40}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />
      <View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: OVERLAY_COLOR }]}
      />
    </View>
  )
}
