import { useEffect, useState } from "react"
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"

import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"
import { useScreenBackground } from "@/hooks/useScreenBackground"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { registerPushToken } from "@/lib/pushTokenRegistration"
import { LOGIN_COPY } from "@/constants/signup"

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [noticeEmail, setNoticeEmail] = useState("")
  const { source: backgroundSource, onError: onBackgroundError } = useScreenBackground(
    "(auth)/login",
    require("@/assets/images/redwoods.trail1.png")
  )

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
        setNotice(LOGIN_COPY.unconfirmedNotice)
        return
      }
      setError(err.message)
      return
    }

    if (data?.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut()
      setNoticeEmail(trimmed)
      setNotice(LOGIN_COPY.unconfirmedNotice)
      return
    }

    await registerPushToken().catch(() => {})
    router.replace("/(tabs)")
  }

  return (
    <View style={styles.root}>
      <ImageBackground
        source={backgroundSource}
        style={styles.bg}
        resizeMode="cover"
        onError={onBackgroundError}
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={[
                styles.scrollContent,
                {
                  paddingTop: 6,
                  paddingBottom: Math.max(insets.bottom + 40, 56),
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.headerBlock}>
                <ThemedText style={styles.pageTitle}>Your Portal</ThemedText>
                <ThemedText type="muted" style={styles.pageSubhead}>
                  Energy • Rituals • Circles
                </ThemedText>
              </View>

              <TranslucentCard tone="dark" opacity={1.18} style={styles.card}>
                {notice ? (
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
                      {LOGIN_COPY.spamHint}
                    </ThemedText>
                  </View>
                ) : null}

                <ThemedText type="muted" style={styles.label}>
                  Email
                </ThemedText>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255,255,255,0.48)"
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
                    placeholderTextColor="rgba(255,255,255,0.48)"
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
                      color="rgba(255,255,255,0.72)"
                    />
                  </Pressable>
                </View>

                {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

                <Pressable
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <ThemedText type="defaultSemiBold" style={styles.submitText}>
                    {loading ? "Signing In..." : "Sign In"}
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={styles.signupLink}
                  onPress={() => router.push("/(auth)/signup")}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <ThemedText type="muted" style={styles.signupLinkText}>
                    Don&apos;t have an account?
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.signupLinkButton}>
                    Create account
                  </ThemedText>
                </Pressable>
              </TranslucentCard>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  bg: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  safe: { flex: 1 },

  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
    justifyContent: "center",
  },

  headerBlock: {
    marginTop: 24,
    marginBottom: 32,
    alignItems: "center",
  },

  pageTitle: {
    fontSize: 32,
    lineHeight: 38,
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 0.4,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  pageSubhead: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    color: "rgba(255,255,255,0.88)",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  card: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },

  notice: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    gap: 8,
  },

  noticeText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
  },

  noticeEmail: {
    fontSize: 12,
    color: "rgba(255,255,255,0.68)",
  },

  noticeHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.68)",
  },

  label: {
    fontSize: 15,
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 17,
    color: "white",
  },

  passwordRow: {
    position: "relative",
  },

  inputWithToggle: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingRight: 46,
    fontSize: 17,
    color: "white",
  },

  toggleButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },

  errorText: {
    color: "rgba(255,120,120,0.96)",
    fontSize: 12,
    marginTop: 10,
  },

  submitButton: {
    marginTop: 18,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "rgba(120, 170, 140, 0.65)",
    alignItems: "center",
  },

  submitButtonDisabled: {
    opacity: 0.55,
  },

  submitText: {
    color: "white",
    fontSize: 16,
  },

  signupLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    gap: 4,
    flexWrap: "wrap",
  },

  signupLinkText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.72)",
  },

  signupLinkButton: {
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
  },
})