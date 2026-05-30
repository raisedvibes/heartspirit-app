import { useCallback, useEffect, useRef, useState } from "react"
import { Animated, Easing, ImageBackground, StyleSheet } from "react-native"
import * as SplashScreen from "expo-splash-screen"

type IntroScreenProps = {
  onFinish: () => void
  /** When false, intro stays mounted but splash stays up and hold/fade do not start. */
  canReveal?: boolean
  /** Full sequence length (hold + fade-out) in ms; guest ~5.5s, returning ~3.1s. */
  totalDurationMs?: number
  onBackgroundReady?: () => void
}

/** Same asset as native splash — first JS frame must match the still shown under SplashScreen. */
const INTRO_SPLASH = require("@/assets/images/heartspirit_intro.png")

const DEFAULT_INTRO_TOTAL_MS = 5500
const FADE_OUT_MS = 350

function holdMsForTotal(totalMs: number) {
  return Math.max(400, totalMs - FADE_OUT_MS)
}

export default function IntroScreen({
  onFinish,
  canReveal = true,
  totalDurationMs,
  onBackgroundReady,
}: IntroScreenProps) {
  const total = totalDurationMs ?? DEFAULT_INTRO_TOTAL_MS
  const holdMs = holdMsForTotal(total)

  const opacity = useRef(new Animated.Value(1)).current
  const [backgroundReady, setBackgroundReady] = useState(false)
  const splashHiddenRef = useRef(false)
  const animationStartedRef = useRef(false)
  const backgroundPaintedRef = useRef(false)
  const onBackgroundReadyRef = useRef(onBackgroundReady)

  onBackgroundReadyRef.current = onBackgroundReady

  const markBackgroundPainted = useCallback(() => {
    if (backgroundPaintedRef.current) return
    backgroundPaintedRef.current = true

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setBackgroundReady(true)
        onBackgroundReadyRef.current?.()
      })
    })
  }, [])

  const handleImageLoad = useCallback(() => {
    markBackgroundPainted()
  }, [markBackgroundPainted])

  useEffect(() => {
    if (!backgroundReady || !canReveal || animationStartedRef.current) return

    animationStartedRef.current = true

    if (!splashHiddenRef.current) {
      splashHiddenRef.current = true
      SplashScreen.hideAsync().catch(() => {})
    }

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
  }, [backgroundReady, canReveal, holdMs, onFinish, opacity])

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <ImageBackground
        source={INTRO_SPLASH}
        style={styles.image}
        resizeMode="cover"
        onLoad={handleImageLoad}
        onLoadEnd={handleImageLoad}
      />
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
})
