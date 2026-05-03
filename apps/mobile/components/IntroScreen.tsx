import { useEffect, useRef } from "react"
import { Animated, Easing, ImageBackground, StyleSheet } from "react-native"

type IntroScreenProps = {
  onFinish: () => void
}

export default function IntroScreen({ onFinish }: IntroScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
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
  }, [onFinish, opacity])

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <ImageBackground
        source={require("@/assets/images/heartspirit-intro.png")}
        style={styles.image}
        resizeMode="cover"
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    /** Native window + RN ImageBackground decode can briefly show black without this. */
    backgroundColor: "#0a1410",
  },
  image: {
    flex: 1,
    backgroundColor: "#0a1410",
  },
})
