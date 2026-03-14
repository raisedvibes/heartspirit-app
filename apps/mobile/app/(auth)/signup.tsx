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
  Switch,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import ScreenContent from "@/components/layout/ScreenContent"
import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"
import { getSupabaseClient } from "@/lib/supabaseClient"

export default function SignupScreen() {
  const insets = useSafeAreaInsets()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [signupEmail, setSignupEmail] = useState("")

  const handleSubmit = async () => {
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    if (!agreeToTerms) {
      setError("You must agree to the Terms and Privacy Policy")
      return
    }

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) return

    setLoading(true)

    const supabase = getSupabaseClient()
    if (!supabase) {
      setError("App not configured")
      setLoading(false)
      return
    }

    const { data, error: err } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          display_name: trimmedName ? trimmedName.split(/\s+/)[0] : "",
          full_name: trimmedName,
        },
      },
    })

    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    if (!data?.session) {
      setSignupEmail(trimmedEmail)
      setEmailSent(true)
      return
    }

    router.replace("/(tabs)")
  }

  if (emailSent) {
    return (
      <View style={styles.root}>
        <ImageBackground
          source={require("@/assets/images/fern.background.png")}
          style={styles.bg}
          resizeMode="cover"
        >
          <ScreenContent noTabPadding>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
              showsVerticalScrollIndicator={false}
            >
              <Pressable onPress={() => router.back()} style={[styles.backButton, { marginTop: insets.top + 8 }]}>
                <MaterialIcons name="arrow-back" size={22} color="rgba(255,255,255,0.9)" />
                <ThemedText type="defaultSemiBold" style={styles.backText}>Back</ThemedText>
              </Pressable>
              <TranslucentCard style={styles.card}>
                <ThemedText type="title" style={styles.confirmTitle}>
                  Your Heartspirit portal is ready ✨
                </ThemedText>
                <ThemedText type="default" style={styles.confirmBody}>
                  Check your email to activate your access.
                </ThemedText>
                <ThemedText type="muted" style={styles.confirmEmail}>
                  Sent to {signupEmail}
                </ThemedText>
                <Pressable
                  style={styles.submitButton}
                  onPress={() => router.replace("/(auth)/login")}
                >
                  <ThemedText type="defaultSemiBold" style={styles.submitText}>Go to Login</ThemedText>
                </Pressable>
                <ThemedText type="muted" style={styles.confirmHint}>
                  If you don't see it, check your spam/promotions folder.
                </ThemedText>
              </TranslucentCard>
            </ScrollView>
          </ScreenContent>
        </ImageBackground>
      </View>
    )
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
                <ThemedText type="defaultSemiBold" style={styles.backText}>Back</ThemedText>
              </Pressable>

              <View style={styles.headerBlock}>
                <ThemedText type="title" style={styles.headerTitle}>Create Account</ThemedText>
                <ThemedText type="muted" style={styles.headerSubtitle}>Start today</ThemedText>
              </View>

              <TranslucentCard style={styles.card}>
                <ThemedText type="muted" style={styles.label}>Full Name</ThemedText>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="words"
                  editable={!loading}
                />

                <ThemedText type="muted" style={styles.label}>Email</ThemedText>
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

                <ThemedText type="muted" style={styles.label}>Password</ThemedText>
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
                  <Pressable style={styles.toggleButton} onPress={() => setShowPassword((p) => !p)} hitSlop={12}>
                    <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={22} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                </View>

                <ThemedText type="muted" style={styles.label}>Confirm Password</ThemedText>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.inputWithToggle}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                  />
                  <Pressable style={styles.toggleButton} onPress={() => setShowConfirmPassword((p) => !p)} hitSlop={12}>
                    <MaterialIcons name={showConfirmPassword ? "visibility-off" : "visibility"} size={22} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                </View>

                <View style={styles.termsRow}>
                  <Switch
                    value={agreeToTerms}
                    onValueChange={setAgreeToTerms}
                    trackColor={{ false: "rgba(255,255,255,0.2)", true: "rgba(120,170,140,0.8)" }}
                    thumbColor="white"
                  />
                  <ThemedText type="muted" style={styles.termsText}>
                    I agree to the Terms of Use and Privacy Policy
                  </ThemedText>
                </View>

                {error && (
                  <ThemedText style={[styles.label, { color: "rgba(255,120,120,0.95)" }]}>{error}</ThemedText>
                )}

                <Pressable
                  style={[styles.submitButton, (loading || !agreeToTerms) && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading || !agreeToTerms}
                >
                  <ThemedText type="defaultSemiBold" style={styles.submitText}>
                    {loading ? "Creating..." : "Create Account"}
                  </ThemedText>
                </Pressable>

                <View style={styles.loginLink}>
                  <ThemedText type="muted" style={styles.loginLinkText}>Already have an account? </ThemedText>
                  <Pressable onPress={() => router.replace("/(auth)/login")}>
                    <ThemedText type="defaultSemiBold" style={styles.loginLinkButton}>Sign in</ThemedText>
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
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24 },
  backText: { color: "rgba(255,255,255,0.9)", fontSize: 16 },
  headerBlock: { marginBottom: 24 },
  headerTitle: { fontSize: 24 },
  headerSubtitle: { marginTop: 8 },
  card: { padding: 20 },
  label: { fontSize: 12, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "white",
  },
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
  toggleButton: { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" },
  termsRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  termsText: { flex: 1, fontSize: 14, color: "rgba(255,255,255,0.7)" },
  submitButton: { marginTop: 24, paddingVertical: 14, borderRadius: 12, backgroundColor: "rgba(120, 170, 140, 0.65)", alignItems: "center" },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: "white", fontSize: 16 },
  loginLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16, gap: 4 },
  loginLinkText: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  loginLinkButton: { fontSize: 14, color: "rgba(255,255,255,0.9)" },
  confirmTitle: { fontSize: 22, marginBottom: 12, textAlign: "center" },
  confirmBody: { marginBottom: 8, color: "rgba(255,255,255,0.9)" },
  confirmEmail: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 16 },
  confirmHint: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 12 },
})
