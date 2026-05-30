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
  ImageBackground,
  type KeyboardEvent,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"

import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { useAuth } from "@/lib/auth"
import { RESET_PASSWORD_COPY, SIGNUP_COPY } from "@/constants/signup"

const AUTH_SURFACE = "#0a1410"
const REDWOODS = require("@/assets/images/redwoods_trail1.png")

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets()
  const { session, loading: authLoading, clearPendingPasswordRecovery } = useAuth()
  const [keyboardPad, setKeyboardPad] = useState(0)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    if (authLoading) return
    if (!session) {
      clearPendingPasswordRecovery()
      router.replace("/(auth)/login")
    }
  }, [authLoading, session, clearPendingPasswordRecovery])

  const handleSubmit = async () => {
    setError(null)

    if (password !== confirmPassword) {
      setError(SIGNUP_COPY.errors.passwordsDontMatch)
      return
    }

    if (password.length < 8) {
      setError(SIGNUP_COPY.passwordHints.minLength)
      return
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      setError("App not configured")
      return
    }

    setLoading(true)

    const { error: err } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    clearPendingPasswordRecovery()
    router.replace("/(tabs)")
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

  if (authLoading || !session) {
    return <View style={styles.shell} />
  }

  return (
    <View style={styles.shell}>
      <ImageBackground source={REDWOODS} style={styles.image} resizeMode="cover">
        <View style={styles.flatOverlay} pointerEvents="none" />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0.12)", "rgba(5, 10, 8, 0.38)"]}
          style={StyleSheet.absoluteFill}
        />
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
                <ThemedText style={styles.cardTitle}>{RESET_PASSWORD_COPY.headline}</ThemedText>
                <ThemedText type="muted" style={styles.bodyText}>
                  {RESET_PASSWORD_COPY.body}
                </ThemedText>

                <ThemedText type="muted" style={[styles.label, keyboardOpen && styles.labelKb]}>
                  New Password
                </ThemedText>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.inputWithToggle}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter new password"
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

                <ThemedText type="muted" style={[styles.label, keyboardOpen && styles.labelKb]}>
                  Confirm Password
                </ThemedText>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.inputWithToggle}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor="rgba(255,255,255,0.5)"
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

                {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

                <Pressable
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <ThemedText type="defaultSemiBold" style={styles.submitText}>
                    {loading ? RESET_PASSWORD_COPY.ctaLoading : RESET_PASSWORD_COPY.cta}
                  </ThemedText>
                </Pressable>
              </View>
            </TranslucentCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: AUTH_SURFACE,
  },
  image: {
    flex: 1,
    backgroundColor: AUTH_SURFACE,
  },
  flatOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
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
})
