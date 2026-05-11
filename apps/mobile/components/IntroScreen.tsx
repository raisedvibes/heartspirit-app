import { useEffect, useRef } from "react"
import { Animated, Easing, ImageBackground, StyleSheet, Text, View } from "react-native"

type IntroScreenProps = {
  onFinish: () => void
  /** Full sequence length (hold + fade-out) in ms; guest ~5.5s, returning ~3.1s. */
  totalDurationMs?: number
}

const REDWOODS = require("@/assets/images/redwoods_trail1.png")

const DEFAULT_INTRO_TOTAL_MS = 5500
const FADE_OUT_MS = 350

function holdMsForTotal(totalMs: number) {
  return Math.max(400, totalMs - FADE_OUT_MS)
}

export default function IntroScreen({ onFinish, totalDurationMs }: IntroScreenProps) {
  const total = totalDurationMs ?? DEFAULT_INTRO_TOTAL_MS
  const holdMs = holdMsForTotal(total)

  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(holdMs),
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ])

    animation.start(({ finished }) => {
      if (finished) onFinish()
    })

    return () => {
      animation.stop()
    }
  }, [holdMs, onFinish, opacity])

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <ImageBackground source={REDWOODS} style={styles.image} resizeMode="cover">
        <View style={styles.brandRow} pointerEvents="none">
          <Text style={styles.brandText}>heartspirit</Text>
        </View>
      </ImageBackground>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    backgroundColor: "#0a1410",
  },
  image: {
    flex: 1,
    backgroundColor: "#0a1410",
  },
  /** Slightly above vertical center; matches reference layout. */
  brandRow: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 88,
  },
  brandText: {
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: 0.6,
    textAlign: "center",
    color: "#efefef",
    fontFamily: "AlegreyaSans_400Regular",
    fontWeight: "400",
  },
})
