import { useEffect, useState } from "react"
import { router } from "expo-router"
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  type KeyboardEvent,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { getPasswordResetRedirectUrl } from "@/lib/authDeepLink"
import { FORGOT_PASSWORD_COPY } from "@/constants/signup"

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets()
  const [keyboardPad, setKeyboardPad] = useState(0)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [sentEmail, setSentEmail] = useState("")

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow"
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide"
    const subShow = Keyboard.addListener(showEvt, (e: KeyboardEvent) => {
      setKeyboardPad(e.endCoordinates.height)
    })
    const subHide = Keyboard.addListener(hideEvt, () => setKeyboardPad(0))
    return () => {
      subShow.remove()
      subHide.remove()
    }
  }, [])

  const handleSubmit = async () => {
    const trimmed = email.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)

    const supabase = getSupabaseClient()
    if (!supabase) {
      setError("App not configured")
      setLoading(false)
      return
    }

    const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: getPasswordResetRedirectUrl(),
    })

    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    setSentEmail(trimmed)
    setEmailSent(true)
  }

  const keyboardOpen = keyboardPad > 0

  const scrollContentCinematic = {
    flexGrow: 1,
    justifyContent: "center" as const,
    paddingTop: insets.top + 28,
    paddingBottom: insets.bottom + 40,
    paddingHorizontal: 20,
  }
  const scrollContentFocus = {
    flexGrow: 1,
    justifyContent: "flex-start" as const,
    paddingTop: insets.top + 24,
    paddingBottom:
      Platform.OS === "ios"
        ? insets.bottom + 4
        : keyboardPad + insets.bottom + 48,
    paddingHorizontal: 20,
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.avoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={keyboardOpen ? scrollContentFocus : scrollContentCinematic}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
        >
          <View style={[styles.headerBlock, keyboardOpen && styles.heroFocusMode]}>
            <ThemedText style={styles.pageTitle}>Your Portal</ThemedText>
            <ThemedText type="muted" style={styles.pageSubhead}>
              Energy • Rituals • Circles
            </ThemedText>
          </View>

          <TranslucentCard
            tone="dark"
            opacity={1.18}
            style={[styles.card, styles.cardFrame, keyboardOpen && styles.cardFocusPanel]}
          >
            <View style={styles.cardForm}>
              {emailSent ? (
                <>
                  <ThemedText type="muted" style={styles.confirmBody}>
                    {FORGOT_PASSWORD_COPY.confirmationBody}
                  </ThemedText>
                  <ThemedText type="muted" style={styles.confirmEmail}>
                    {FORGOT_PASSWORD_COPY.confirmationSentTo} {sentEmail}
                  </ThemedText>
                  <ThemedText type="muted" style={styles.confirmHint}>
                    {FORGOT_PASSWORD_COPY.confirmationHint}
                  </ThemedText>
                  <Pressable
                    style={styles.submitButton}
                    onPress={() => router.replace("/(auth)/login")}
                  >
                    <ThemedText type="defaultSemiBold" style={styles.submitText}>
                      {FORGOT_PASSWORD_COPY.confirmationCta}
                    </ThemedText>
                  </Pressable>
                </>
              ) : (
                <>
                  <ThemedText style={styles.cardTitle}>{FORGOT_PASSWORD_COPY.headline}</ThemedText>
                  <ThemedText type="muted" style={styles.bodyText}>
                    {FORGOT_PASSWORD_COPY.body}
                  </ThemedText>

                  <ThemedText type="muted" style={[styles.label, keyboardOpen && styles.labelKb]}>
                    Email
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />

                  {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

                  <Pressable
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    <ThemedText type="defaultSemiBold" style={styles.submitText}>
                      {loading ? FORGOT_PASSWORD_COPY.ctaLoading : FORGOT_PASSWORD_COPY.cta}
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    style={styles.backLink}
                    onPress={() => router.replace("/(auth)/login")}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <ThemedText type="defaultSemiBold" style={styles.backLinkText}>
                      {FORGOT_PASSWORD_COPY.backToLogin}
                    </ThemedText>
                  </Pressable>
                </>
              )}
            </View>
          </TranslucentCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  avoid: { flex: 1 },
  scroll: { flex: 1 },
  headerBlock: {
    marginTop: 16,
    marginBottom: 28,
    alignItems: "center",
  },
  heroFocusMode: {
    opacity: 0,
    height: 0,
    minHeight: 0,
    marginTop: 0,
    marginBottom: 0,
    overflow: "hidden",
    pointerEvents: "none",
  },
  pageTitle: {
    fontSize: 32,
    lineHeight: 38,
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 0.4,
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  pageSubhead: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    color: "rgba(255,255,255,0.88)",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  cardFrame: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  cardForm: {
    width: "100%",
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
  cardFocusPanel: {
    paddingTop: 9,
    paddingBottom: 11,
    marginTop: 4,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 24,
    lineHeight: 30,
    color: "#ffffff",
    fontFamily: "AlegreyaSans_500Medium",
    textAlign: "center",
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: 12,
  },
  labelKb: {
    marginTop: 7,
    marginBottom: 6,
  },
  label: {
    fontSize: 15,
    marginBottom: 7,
    marginTop: 10,
    color: "rgba(255,255,255,0.85)",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 17,
    color: "rgba(255,255,255,0.9)",
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
    ...Platform.select({
      ios: {
        shadowColor: "#050a08",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.32,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  submitButtonDisabled: {
    opacity: 0.55,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
        shadowRadius: 0,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 0,
      },
      default: {},
    }),
  },
  submitText: {
    color: "white",
    fontSize: 16,
  },
  backLink: {
    alignItems: "center",
    marginTop: 14,
  },
  backLinkText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
  },
  confirmBody: {
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  confirmEmail: {
    marginBottom: 10,
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  confirmHint: {
    marginBottom: 16,
    fontSize: 12,
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
  },
})
