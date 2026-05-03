import { Stack } from "expo-router"

const AUTH_SURFACE = "#0a1410"

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        /** Fade cross-fades through transparency and reveals the OS window (black) behind screens. */
        animation: "none",
        contentStyle: { backgroundColor: AUTH_SURFACE },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  )
}
