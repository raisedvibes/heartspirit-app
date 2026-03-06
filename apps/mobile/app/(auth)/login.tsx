import { useState } from "react"
import { router } from "expo-router"
import {
  View,
  StyleSheet,
  ImageBackground,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import ScreenContent from "@/components/layout/ScreenContent"
import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { registerPushToken } from "@/lib/pushTokenRegistration"

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [noticeEmail, setNoticeEmail] = useState("")

  const handleSubmit = async () => {
    const trimmed = email.trim()
    if (!trimmed || !password) return

    setLoading(true)
    setError(null)
    setNotice(null)
    setNoticeEmail("")

    const supabase = getSupabaseClient()
    if (!supabase) {
      setError("App not configured")
      setLoading(false)
      return
    }

    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    })

    setLoading(false)

    if (err) {
      const msg = (err.message || "").toLowerCase()
      if (
        msg.includes("email") &&
        (msg.includes("confirm") ||
          msg.includes("confirmed") ||
          msg.includes("verify") ||
          msg.includes("verification"))
      ) {
        setNoticeEmail(trimmed)
        setNotice("Your portal isn't activated yet. Confirm your email, then sign in.")
        return
      }
      setError(err.message)
      return
    }

    if (data?.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut()
      setNoticeEmail(trimmed)
      setNotice("Your portal isn't activated yet. Confirm your email, then sign in.")
      return
    }

    await registerPushToken().catch(() => {})
    router.replace("/(tabs)")
  }

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require("@/assets/images/fern.background.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <ScreenContent noTabPadding>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Pressable onPress={() => router.back()} style={[styles.backButton, { marginTop: insets.top + 8 }]}>
                <MaterialIcons name="arrow-back" size={22} color="rgba(255,255,255,0.9)" />
                <ThemedText type="defaultSemiBold" style={styles.backText}>
                  Back
                </ThemedText>
              </Pressable>

              <View style={styles.headerBlock}>
                <ThemedText type="title" style={styles.headerTitle}>
                  Enter Your Portal
                </ThemedText>
                <ThemedText type="muted" style={styles.headerSubtitle}>
                  Sync notification preferences and receive circle reminders
                </ThemedText>
              </View>

              <TranslucentCard style={styles.card}>
                {notice && (
                  <View style={styles.notice}>
                    <ThemedText type="default" style={styles.noticeText}>
                      {notice}
                    </ThemedText>
                    {noticeEmail ? (
                      <ThemedText type="muted" style={styles.noticeEmail}>
                        Email: {noticeEmail}
                      </ThemedText>
                    ) : null}
                    <ThemedText type="muted" style={styles.noticeHint}>
                      If you don't see the message, check spam/promotions.
                    </ThemedText>
                  </View>
                )}

                <ThemedText type="muted" style={styles.label}>
                  Email
                </ThemedText>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />

                <ThemedText type="muted" style={styles.label}>
                  Password
                </ThemedText>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.inputWithToggle}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <Pressable
                    style={styles.toggleButton}
                    onPress={() => setShowPassword((p) => !p)}
                    hitSlop={12}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={22}
                      color="rgba(255,255,255,0.6)"
                    />
                  </Pressable>
                </View>

                {error && (
                  <ThemedText style={[styles.label, { color: "rgba(255,120,120,0.95)" }]}>{error}</ThemedText>
                )}

                <Pressable
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <ThemedText type="defaultSemiBold" style={styles.submitText}>
                    {loading ? "Signing in…" : "Sign In"}
                  </ThemedText>
                </Pressable>

                <View style={styles.signupLink}>
                  <ThemedText type="muted" style={styles.signupLinkText}>
                    Don't have an account?{" "}
                  </ThemedText>
                  <Pressable onPress={() => router.replace("/(auth)/signup")}>
                    <ThemedText type="defaultSemiBold" style={styles.signupLinkButton}>
                      Create account
                    </ThemedText>
                  </Pressable>
                </View>
              </TranslucentCard>
            </ScrollView>
          </KeyboardAvoidingView>
        </ScreenContent>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  backText: { color: "rgba(255,255,255,0.9)", fontSize: 16 },
  headerBlock: { marginBottom: 24 },
  headerTitle: { fontSize: 24 },
  headerSubtitle: { marginTop: 8 },
  card: { padding: 20 },
  notice: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    gap: 8,
  },
  noticeText: { color: "rgba(255,255,255,0.9)", fontSize: 14 },
  noticeEmail: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  noticeHint: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  passwordRow: { position: "relative" },
  inputWithToggle: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingRight: 44,
    fontSize: 16,
    color: "white",
  },
  toggleButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  label: { fontSize: 12, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "white",
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(120, 170, 140, 0.65)",
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: "white", fontSize: 16 },
  signupLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 4,
  },
  signupLinkText: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  signupLinkButton: { fontSize: 14, color: "rgba(255,255,255,0.9)" },
})
