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
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
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
  },
  image: {
    flex: 1,
  },
})
