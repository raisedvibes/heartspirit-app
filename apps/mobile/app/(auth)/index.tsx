import { useEffect } from "react"
import { Pressable, StyleSheet } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

export default function AuthIndex() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(auth)/signup")
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleContinue = () => {
    router.replace("/(auth)/signup")
  }

  return (
    <Pressable style={styles.root} onPress={handleContinue}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  safe: {
    flex: 1,
  },
})
