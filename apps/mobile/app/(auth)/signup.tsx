import { useEffect, useState } from "react"
import { router } from "expo-router"
import * as Localization from "expo-localization"
import {
  View,
  StyleSheet,
  ImageBackground,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"

import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { SIGNUP_COPY, TERMS_URL, PRIVACY_URL } from "@/constants/signup"

function passwordStrength(password: string) {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  return strength
}

export default function SignupScreen() {
  const insets = useSafeAreaInsets()

  const [fullName, setFullName] = useState("")
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
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)

  const strength = passwordStrength(password)

  useEffect(() => {
    let isMounted = true

    async function loadBackground() {
      const supabase = getSupabaseClient()
      if (!supabase) return

      const { data, error } = await supabase
        .from("app_backgrounds")
        .select("image_url")
        .eq("page_key", "(auth)/signup")
        .eq("is_active", true)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error && data?.image_url && isMounted) {
        setBackgroundUrl(data.image_url)
      }
    }

    loadBackground()

    return () => {
      isMounted = false
    }
  }, [])

  const backgroundSource = backgroundUrl
    ? { uri: backgroundUrl }
    : require("@/assets/images/redwoods.trail1.png")

  const handleSubmit = async () => {
    const trimmedEmail = email.trim()
    const trimmedName = fullName.trim()
    const firstName = trimmedName ? trimmedName.split(/\s+/)[0] : ""
    const timezone = Localization.getCalendars()?.[0]?.timeZone || null

    setError(null)

    if (password !== confirmPassword) {
      setError(SIGNUP_COPY.errors.passwordsDontMatch)
      return
    }

    if (!agreeToTerms) {
      setError(SIGNUP_COPY.errors.mustAgreeToTerms)
      return
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      setError("App not configured")
      return
    }

    setLoading(true)

    const { data, error: err } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          display_name: firstName,
          full_name: trimmedName,
          timezone,
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

  return (
    <View style={styles.root}>
      <ImageBackground source={backgroundSource} style={styles.bg} resizeMode="cover">
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
                <ThemedText style={styles.pageTitle}>Enter Your Portal</ThemedText>
                <ThemedText type="muted" style={styles.pageSubhead}>
                  Rituals • Energy • Circles
                </ThemedText>
              </View>

              {emailSent ? (
                <TranslucentCard tone="dark" opacity={1.08} style={styles.card}>
                  <View style={styles.cardHeaderBlock}>
                    <ThemedText style={styles.cardTitle}>
                      {SIGNUP_COPY.confirmationTitle}
                    </ThemedText>
                  </View>

                  <ThemedText type="muted" style={styles.confirmBody}>
                    {SIGNUP_COPY.confirmationBody}
                  </ThemedText>

                  <ThemedText type="muted" style={styles.confirmEmail}>
                    {SIGNUP_COPY.confirmationSentTo} {signupEmail}
                  </ThemedText>

                  <Pressable
                    style={styles.submitButton}
                    onPress={() => router.replace("/(auth)/login")}
                  >
                    <ThemedText type="defaultSemiBold" style={styles.submitText}>
                      {SIGNUP_COPY.confirmationCta}
                    </ThemedText>
                  </Pressable>

                  <ThemedText type="muted" style={styles.confirmHint}>
                    {SIGNUP_COPY.confirmationHint}
                  </ThemedText>
                </TranslucentCard>
              ) : (
                <TranslucentCard tone="dark" opacity={1.18} style={styles.card}>
                  <View style={styles.cardHeaderBlock}>
                    <ThemedText style={styles.cardTitle}>Create Account</ThemedText>
                  </View>

                  <ThemedText type="muted" style={styles.label}>
                    {SIGNUP_COPY.fields.fullName}
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor="rgba(255,255,255,0.48)"
                    autoCapitalize="words"
                    editable={!loading}
                  />

                  <ThemedText type="muted" style={styles.label}>
                    {SIGNUP_COPY.fields.email}
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
                    {SIGNUP_COPY.fields.password}
                  </ThemedText>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={styles.inputWithToggle}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Create a password"
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

                  {password ? (
                    <View style={styles.strengthBlock}>
                      <View style={styles.strengthRow}>
                        {[1, 2, 3, 4].map((level) => (
                          <View
                            key={level}
                            style={[
                              styles.strengthBar,
                              strength >= level && styles.strengthBarActive,
                            ]}
                          />
                        ))}
                      </View>

                      <View style={styles.hintsRow}>
                        <View style={styles.hintItem}>
                          <MaterialIcons
                            name="check"
                            size={14}
                            color={
                              password.length >= 8
                                ? "rgba(255,255,255,0.92)"
                                : "rgba(255,255,255,0.55)"
                            }
                          />
                          <ThemedText type="muted" style={styles.hintText}>
                            {SIGNUP_COPY.passwordHints.minLength}
                          </ThemedText>
                        </View>

                        <View style={styles.hintItem}>
                          <MaterialIcons
                            name="check"
                            size={14}
                            color={
                              /[A-Z]/.test(password)
                                ? "rgba(255,255,255,0.92)"
                                : "rgba(255,255,255,0.55)"
                            }
                          />
                          <ThemedText type="muted" style={styles.hintText}>
                            {SIGNUP_COPY.passwordHints.uppercase}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  ) : null}

                  <ThemedText type="muted" style={styles.label}>
                    {SIGNUP_COPY.fields.confirmPassword}
                  </ThemedText>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={styles.inputWithToggle}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm your password"
                      placeholderTextColor="rgba(255,255,255,0.48)"
                      secureTextEntry={!showConfirmPassword}
                      editable={!loading}
                    />
                    <Pressable
                      style={styles.toggleButton}
                      onPress={() => setShowConfirmPassword((p) => !p)}
                      hitSlop={12}
                    >
                      <MaterialIcons
                        name={showConfirmPassword ? "visibility-off" : "visibility"}
                        size={22}
                        color="rgba(255,255,255,0.72)"
                      />
                    </Pressable>
                  </View>

                  <Pressable
                    style={styles.termsRow}
                    onPress={() => setAgreeToTerms((v) => !v)}
                  >
                    <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                      {agreeToTerms ? (
                        <MaterialIcons name="check" size={14} color="#ffffff" />
                      ) : null}
                    </View>

                    <View style={styles.termsTextWrap}>
                      <ThemedText type="muted" style={styles.termsText}>
                        I agree to the{" "}
                      </ThemedText>

                      <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
                        <ThemedText style={styles.inlineLink}>Terms of Use</ThemedText>
                      </Pressable>

                      <ThemedText type="muted" style={styles.termsText}>
                        {" "}and{" "}
                      </ThemedText>

                      <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
                        <ThemedText style={styles.inlineLink}>Privacy Policy</ThemedText>
                      </Pressable>
                    </View>
                  </Pressable>

                  {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

                  <Pressable
                    style={[
                      styles.submitButton,
                      (!agreeToTerms || loading) && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!agreeToTerms || loading}
                  >
                    <ThemedText type="defaultSemiBold" style={styles.submitText}>
                      {loading ? SIGNUP_COPY.ctaLoading : SIGNUP_COPY.cta}
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    style={styles.loginLink}
                    onPress={() => router.push("/(auth)/login")}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <ThemedText type="muted" style={styles.loginLinkText}>
                      Already have an account?
                    </ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.loginLinkButton}>
                      Log In
                    </ThemedText>
                  </Pressable>
                </TranslucentCard>
              )}
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
  },
  headerBlock: {
    marginTop: 64,
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 34,
    lineHeight: 38,
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 0.4,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  pageSubhead: {
    marginTop: 8,
    fontSize: 17,
    letterSpacing: 0.6,
    lineHeight: 22,
    textAlign: "center",
    color: "rgba(255,255,255,0.92)",
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
  cardHeaderBlock: {
    marginBottom: 4,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 24,
    lineHeight: 30,
    color: "#ffffff",
    fontFamily: "AlegreyaSans_500Medium",
    textAlign: "center",
  },
  label: {
    fontSize: 15,
    marginBottom: 7,
    marginTop: 9,
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
  strengthBlock: {
    marginTop: 8,
    marginBottom: 2,
    gap: 8,
  },
  strengthRow: {
    flexDirection: "row",
    gap: 6,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  strengthBarActive: {
    backgroundColor: "rgba(255,255,255,0.82)",
  },
  hintsRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  hintItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hintText: {
    fontSize: 12,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "rgba(255,255,255,0.20)",
    borderColor: "rgba(255,255,255,0.55)",
  },
  termsTextWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
  },
  termsText: {
    fontSize: 13,
    lineHeight: 20,
  },
  inlineLink: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.95)",
    textDecorationLine: "underline",
  },
  errorText: {
    color: "rgba(255,120,120,0.96)",
    fontSize: 12,
    marginTop: 10,
  },
  submitButton: {
    marginTop: 16,
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
  loginLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 4,
    flexWrap: "wrap",
  },
  loginLinkText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.72)",
  },
  loginLinkButton: {
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
  },
  confirmBody: {
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  confirmEmail: {
    marginBottom: 16,
    fontSize: 12,
  },
  confirmHint: {
    marginTop: 14,
    fontSize: 12,
    textAlign: "center",
  },
})