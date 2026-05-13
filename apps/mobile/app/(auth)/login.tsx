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
import MaterialIcons from "@expo/vector-icons/MaterialIcons"

import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { LOGIN_COPY } from "@/constants/signup"

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const [keyboardPad, setKeyboardPad] = useState(0)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [noticeEmail, setNoticeEmail] = useState("")

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

    router.replace("/(tabs)")
  }

  const keyboardOpen = keyboardPad > 0

  /** Cinematic: centered hero + card. Focus: top-anchored form, hero collapsed via style only (same tree). */
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
    // iOS: KAV already shrinks for keyboard — do not add keyboardPad here (avoids huge blank scroll).
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

              <ThemedText type="muted" style={[styles.label, keyboardOpen && styles.labelKb]}>
                Password
              </ThemedText>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.inputWithToggle}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
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
                onPress={() => router.replace("/(auth)/signup")}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <ThemedText type="muted" style={styles.signupLinkText}>
                  Don&apos;t have an account?
                </ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.signupLinkButton}>
                  Create account
                </ThemedText>
              </Pressable>
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

  /**
   * Focus mode: same hero subtree, no swap — opacity 0 + collapsed box so the form sits near the top.
   * (Ritual-style “quiet chrome”; redwoods stay visible around the card.)
   */
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

  /** Focus mode: tighter glass panel, slight top anchor — still readable on redwoods. */
  cardFocusPanel: {
    paddingTop: 9,
    paddingBottom: 11,
    marginTop: 4,
    marginBottom: 4,
  },

  labelKb: {
    marginTop: 7,
    marginBottom: 6,
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

  passwordRow: {
    position: "relative",
  },

  inputWithToggle: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingRight: 46,
    fontSize: 17,
    color: "rgba(255,255,255,0.9)",
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
    color: "rgba(255,255,255,0.85)",
  },

  signupLinkButton: {
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
  },
})
