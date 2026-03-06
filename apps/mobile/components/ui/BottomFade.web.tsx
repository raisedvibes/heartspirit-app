import React from "react"
import { View, StyleSheet } from "react-native"

/**
 * Layered transparent Views simulate a soft gradient without native deps.
 * Top layer is very subtle (no visible lip); layers stack darker toward the tab bar.
 */
export default function BottomFade() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={[styles.layer, styles.layer1]} />
      <View style={[styles.layer, styles.layer2]} />
      <View style={[styles.layer, styles.layer3]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
  },
  layer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  layer1: { height: 56, backgroundColor: "rgba(10,20,16,0.02)" },
  layer2: { height: 36, backgroundColor: "rgba(10,20,16,0.05)" },
  layer3: { height: 16, backgroundColor: "rgba(10,20,16,0.08)" },
})
