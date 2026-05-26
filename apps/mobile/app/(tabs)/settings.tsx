import { useState, useEffect, useCallback } from "react"
import { router, useFocusEffect } from "expo-router"
import { View, StyleSheet, Pressable, Switch, Linking, TextInput, Alert } from "react-native"
import Animated from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import ScreenContent, {
  getTabScrollContentBottomPadding,
  getTabScrollContentTopPadding,
} from "@/components/layout/ScreenContent"
import { useCollapsibleTabHeader } from "@/hooks/useCollapsibleTabHeader"
import TranslucentCard from "@/components/ui/TranslucentCard"
import BottomFade from "@/components/ui/BottomFade"
import { ThemedText } from "@/components/themed-text"
import { getSupabaseClient } from "@/lib/supabaseClient"
import {
  loadCircleReminderPrefs,
  loadPushTokenSyncSnapshot,
  showPushTokenDiagnostics,
  syncPushToken,
  updateCircleReminderPrefs,
  type PushTokenSyncSnapshot,
} from "@/lib/pushTokenRegistration"
import { cancelRitualReminderNotifications } from "@/lib/ritualNotifications"
import {
  clearRitualsInMemoryForAuthTransition,
  deleteLocalRitualDataForUser,
} from "@/lib/ritualsStore"
import {
  enableNotificationsFromPrompt,
  isNotificationPermissionGranted,
  STAY_IN_RHYTHM_PROMPT,
} from "@/lib/notificationPermissionPrompt"

type SectionKey = "about" | "profile" | "notifications" | "privacy" | "support"

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const { scrollHandler } = useCollapsibleTabHeader("settings")

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    about: false,
    profile: false,
    notifications: false,
    privacy: false,
    support: false,
  })

  // Notifications
  const [communityCircles, setCommunityCircles] = useState(false)
  const [osNotifGranted, setOsNotifGranted] = useState<boolean | null>(null)
  const [pushSyncSnapshot, setPushSyncSnapshot] = useState<PushTokenSyncSnapshot | null>(null)
  const [pushSyncLoading, setPushSyncLoading] = useState(false)
  const pushDiagnosticsVisible = showPushTokenDiagnostics()

  const refreshOsNotificationPermission = useCallback(async () => {
    const granted = await isNotificationPermissionGranted()
    setOsNotifGranted(granted)
  }, [])

  const refreshPushRegistration = useCallback(async (force: boolean) => {
    if (pushDiagnosticsVisible) {
      setPushSyncLoading(true)
    }
    try {
      if (await isNotificationPermissionGranted()) {
        await syncPushToken({
          reason: force ? "settings-force-sync" : "settings-check",
          force,
        })
      }
      if (pushDiagnosticsVisible) {
        const snapshot = await loadPushTokenSyncSnapshot()
        setPushSyncSnapshot(snapshot)
      }
    } finally {
      if (pushDiagnosticsVisible) {
        setPushSyncLoading(false)
      }
    }
  }, [pushDiagnosticsVisible])

  // Auth & profile
  const [authUser, setAuthUser] = useState<{ id: string; email?: string } | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profile, setProfile] = useState({ display_name: "", full_name: "", email: "" })
  const [editingProfile, setEditingProfile] = useState(false)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [saveProfileLoading, setSaveProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false)
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null)

  // Privacy / local data
  const [saveHistoryOnDevice, setSaveHistoryOnDevice] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setProfileLoading(false)
      return
    }

    const init = async () => {
      setProfileLoading(true)
      setProfileError(null)
      setLogoutError(null)

      const { data: auth } = await supabase.auth.getUser()
      const user = auth?.user ?? null

      setAuthUser(user ? { id: user.id, email: user.email ?? undefined } : null)

      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("display_name, full_name, email, notif_rituals_enabled, notif_circles_week_before, notif_circles_day_before")
          .eq("id", user.id)
          .maybeSingle()

        if (prof) {
          setProfile({
            display_name: prof.display_name ?? "",
            full_name: prof.full_name ?? "",
            email: prof.email ?? user.email ?? "",
          })
          const weekBefore = prof.notif_circles_week_before ?? true
          const dayBefore = prof.notif_circles_day_before ?? true
          setCommunityCircles(weekBefore || dayBefore)
        } else {
          const metadataDisplayName =
            (user.user_metadata?.display_name as string | undefined)?.trim() || ""
          const metadataFullName =
            (user.user_metadata?.full_name as string | undefined)?.trim() || ""
          const fallbackDisplayName =
            metadataDisplayName || (metadataFullName ? metadataFullName.split(/\s+/)[0] : "")

          setProfile({
            display_name: fallbackDisplayName,
            full_name: metadataFullName,
            email: user.email ?? "",
          })
          setCommunityCircles(true)

          const { error: upsertErr } = await supabase.from("profiles").upsert({
            id: user.id,
            display_name: fallbackDisplayName || null,
            full_name: metadataFullName || null,
            email: user.email ?? null,
            notif_circles_week_before: true,
            notif_circles_day_before: true,
          })
          if (upsertErr) {
            console.log("[Settings] profile upsert on init:", upsertErr.message)
          }
        }
      } else {
        setProfile({ display_name: "", full_name: "", email: "" })
        setEditingProfile(false)

        const prefs = await loadCircleReminderPrefs()
        setCommunityCircles(prefs.weekBefore || prefs.dayBefore)
      }

      setProfileLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      setAuthUser(user ? { id: user.id, email: user.email ?? undefined } : null)

      if (!user) {
        setProfile({ display_name: "", full_name: "", email: "" })
        setEditingProfile(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void refreshOsNotificationPermission()
      if (!openSections.notifications) return
      void refreshPushRegistration(true)
    }, [openSections.notifications, refreshOsNotificationPermission, refreshPushRegistration])
  )

  useEffect(() => {
    if (!openSections.notifications) return

    void refreshOsNotificationPermission()
    void refreshPushRegistration(true)
  }, [openSections.notifications, refreshOsNotificationPermission, refreshPushRegistration])

  const toggleSection = (section: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const saveProfileToSupabase = async (): Promise<boolean> => {
    const supabase = getSupabaseClient()

    const full_name = editName.trim()
    const display_name = full_name ? full_name.split(/\s+/)[0] : ""
    const email = editEmail.trim()

    console.log("SAVE PROFILE INPUT", {
      full_name,
      display_name,
      email,
      authUserId: authUser?.id,
    })

    if (!supabase || !authUser) {
      setProfile({ display_name, full_name, email })
      return true
    }

    setProfileError(null)
    setSaveProfileLoading(true)

    try {
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: authUser.id,
            full_name: full_name || null,
            display_name: display_name || null,
            email: email || null,
          },
          { onConflict: "id" }
        )
        .select("id, display_name, full_name, email")
        .single()

      console.log("SAVE PROFILE RESPONSE", { data, error })

      if (error) throw error

      setProfile({
        display_name: data.display_name ?? "",
        full_name: data.full_name ?? "",
        email: data.email ?? "",
      })

      return true
    } catch (e: unknown) {
      console.log("SAVE PROFILE ERROR", e)
      setProfileError((e as Error)?.message ?? "Could not save profile")
      return false
    } finally {
      setSaveProfileLoading(false)
    }
  }

  const handleExportData = () => {
    console.log("Export data (local)")
  }

  const handleClearHistory = () => {
    console.log("Clear history (local)")
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account?",
      "This will permanently delete your Heartspirit account. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            Alert.alert("Are you sure?", "Your account will be permanently deleted.", [
              { text: "Keep Account", style: "cancel" },
              {
                text: "Yes, Delete My Account",
                style: "destructive",
                onPress: () => {
                  void runDeleteAccount()
                },
              },
            ])
          },
        },
      ]
    )
  }

  const runDeleteAccount = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setDeleteAccountError("We couldn’t delete your account. Please try again.")
      return
    }

    setDeleteAccountLoading(true)
    setDeleteAccountError(null)
    setLogoutError(null)

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error("No active session")
      }

      const apiBase =
        process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
        process.env.EXPO_PUBLIC_APP_URL?.trim() ||
        process.env.EXPO_PUBLIC_API_URL?.trim() ||
        "https://app.heartspirit.earth"
      const endpoint = `${apiBase.replace(/\/$/, "")}/api/account/delete`

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          "Content-Type": "application/json",
        },
      })

      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        throw new Error(payload?.error || "Delete failed")
      }

      await cancelRitualReminderNotifications()
      if (authUser?.id) {
        await deleteLocalRitualDataForUser(authUser.id)
      } else {
        clearRitualsInMemoryForAuthTransition()
      }
      await supabase.auth.signOut()
      setAuthUser(null)
      setProfile({ display_name: "", full_name: "", email: "" })
      setEditingProfile(false)
      Alert.alert("Account deleted", "Your account has been deleted.")
      router.replace("/(auth)/login")
    } catch (e) {
      console.warn("[Settings] account delete failed", e)
      setDeleteAccountError("We couldn’t delete your account. Please try again.")
    } finally {
      setDeleteAccountLoading(false)
    }
  }

  const SectionHeader = ({
    section,
    iconName,
    title,
  }: {
    section: SectionKey
    iconName: keyof typeof MaterialIcons.glyphMap
    title: string
  }) => (
    <Pressable onPress={() => toggleSection(section)} style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <MaterialIcons name={iconName} size={20} color="rgba(255,255,255,0.9)" />
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          {title}
        </ThemedText>
      </View>
      <MaterialIcons
        name="keyboard-arrow-down"
        size={20}
        color="rgba(255,255,255,0.7)"
        style={{ transform: [{ rotate: openSections[section] ? "180deg" : "0deg" }] }}
      />
    </Pressable>
  )

  return (
    <View style={styles.root}>
      <ScreenContent edgeToEdgeScroll bottomPaddingOverride={0}>
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: getTabScrollContentTopPadding(insets),
              paddingBottom: getTabScrollContentBottomPadding(insets),
            },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <View style={styles.headerBlock}>
            <ThemedText type="title" style={styles.headerTitle}>
              Settings
            </ThemedText>
            <ThemedText type="muted" style={styles.headerSubtitle}>
              manage your experience
            </ThemedText>
          </View>

            <TranslucentCard style={styles.card}>
              <SectionHeader section="about" iconName="favorite" title="About Heartspirit" />
              {openSections.about && (
                <View style={styles.sectionBody}>
                  <View style={styles.aboutBody}>
                  <ThemedText type="muted" style={styles.aboutText}>
  Heartspirit (verb): to integrate the heart and spirit— a return to your natural rhythm, a remembering of the wisdom within.
</ThemedText>

<ThemedText type="muted" style={styles.aboutText}>
  A practice of ritual: choosing presence, deepening connection, and listening inward.
</ThemedText>

<ThemedText type="muted" style={styles.aboutText}>
  A portal—where awareness opens and power returns.
</ThemedText>

                  <ThemedText type="muted" style={styles.aboutText}>
                    — Created by Gabriel{"\n"}
                    <ThemedText
                      type="defaultSemiBold"
                      style={styles.aboutLinkText}
                      accessibilityRole="link"
                      onPress={() => Linking.openURL("https://wellnessranger.com")}
                    >
                      WellnessRanger.com
                      <ThemedText style={styles.aboutLinkGlyph}> ↗</ThemedText>
                    </ThemedText>
                  </ThemedText>
                  </View>
                </View>
              )}
            </TranslucentCard>

            <TranslucentCard style={styles.card}>
              <SectionHeader section="profile" iconName="person" title="Profile" />
              {openSections.profile && (
                <View style={styles.sectionBody}>
                  {profileLoading ? (
                    <ThemedText type="muted" style={styles.profileEmail}>
                      Loading…
                    </ThemedText>
                  ) : !authUser ? (
                    <View style={styles.profileRow}>
                      <View style={styles.profileInfo}>
                        <ThemedText type="muted" style={styles.profileEmail}>
                          Sign in to sync preferences and receive circle reminders
                        </ThemedText>
                      </View>
                      <Pressable
                        style={styles.editButton}
                        onPress={() => router.push("/login" as never)}
                      >
                        <ThemedText type="defaultSemiBold" style={styles.editButtonText}>
                          Sign in
                        </ThemedText>
                      </Pressable>
                    </View>
                  ) : !editingProfile ? (
                    <View style={styles.profileStack}>
                      <View style={styles.profileInfoBlock}>
                        <ThemedText type="defaultSemiBold" style={styles.profileName}>
                          {profile.display_name || "Your name"}
                        </ThemedText>
                        <ThemedText type="muted" style={styles.profileEmail}>
                          {profile.email || authUser.email || "your@email.com"}
                        </ThemedText>
                      </View>
                      <View style={styles.profileActionsRow}>
                        <Pressable
                          style={styles.editButton}
                          onPress={() => {
                            setProfileError(null)
                            setEditName(profile.full_name || profile.display_name)
                            setEditEmail(profile.email)
                            setEditingProfile(true)
                          }}
                        >
                          <MaterialIcons name="edit" size={14} color="white" />
                          <ThemedText type="defaultSemiBold" style={styles.editButtonText}>
                            Edit
                          </ThemedText>
                        </Pressable>

                        <Pressable
                          style={[styles.editButton, styles.signOutButton]}
                          onPress={async () => {
                            setLogoutError(null)
                            const supabase = getSupabaseClient()

                            if (!supabase) {
                              setLogoutError("App not configured")
                              return
                            }

                            await cancelRitualReminderNotifications()
                            clearRitualsInMemoryForAuthTransition()
                            const { error } = await supabase.auth.signOut()
                            if (error) {
                              setLogoutError(error.message)
                              return
                            }

                            setAuthUser(null)
                            setProfile({ display_name: "", full_name: "", email: "" })
                            setEditingProfile(false)
                          }}
                        >
                          <ThemedText type="defaultSemiBold" style={styles.editButtonText}>
                            Sign out
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.editForm}>
                      <ThemedText type="muted" style={styles.inputLabel}>
                        Name
                      </ThemedText>
                      <TextInput
                        style={styles.input}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Your name"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        autoCapitalize="words"
                      />

                      <ThemedText type="muted" style={styles.inputLabel}>
                        Email
                      </ThemedText>
                      <TextInput
                        style={styles.input}
                        value={editEmail}
                        onChangeText={setEditEmail}
                        placeholder="you@email.com"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />

                      <ThemedText type="muted" style={styles.inputHint}>
                        This updates the email we use for support. Sign-in email may require a separate change.
                      </ThemedText>

                      {profileError && (
                        <ThemedText style={[styles.inputLabel, { color: "rgba(255,100,100,0.9)" }]}>
                          {profileError}
                        </ThemedText>
                      )}

                      <View style={styles.modalButtons}>
                        <Pressable
                          style={styles.cancelButton}
                          onPress={() => {
                            setProfileError(null)
                            setEditingProfile(false)
                          }}
                        >
                          <ThemedText type="defaultSemiBold" style={styles.cancelButtonText}>
                            Cancel
                          </ThemedText>
                        </Pressable>

                        <Pressable
                          style={styles.saveButton}
                          onPress={async () => {
                            const ok = await saveProfileToSupabase()
                            if (ok) setEditingProfile(false)
                          }}
                          disabled={saveProfileLoading}
                        >
                          <ThemedText type="defaultSemiBold" style={styles.saveButtonText}>
                            {saveProfileLoading ? "Saving..." : "Save"}
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {profileError && !editingProfile && authUser && (
                    <ThemedText style={[styles.inputLabel, { color: "rgba(255,100,100,0.9)", marginTop: 8 }]}>
                      {profileError}
                    </ThemedText>
                  )}

                  {logoutError && authUser && (
                    <ThemedText style={[styles.inputLabel, { color: "rgba(255,100,100,0.9)", marginTop: 8 }]}>
                      {logoutError}
                    </ThemedText>
                  )}

                  <ThemedText type="muted" style={styles.footnote}>
                    We only use your contact info for account access. Your ritual history and
                    check-ins stay on your device.
                  </ThemedText>

                  {!!authUser && !editingProfile && (
                    <View style={styles.deleteAccountWrap}>
                      <Pressable
                        style={[styles.linkButton, styles.deleteAccountButton]}
                        onPress={handleDeleteAccount}
                        disabled={deleteAccountLoading}
                      >
                        <MaterialIcons name="delete-forever" size={18} color="rgba(255,150,150,0.95)" />
                        <ThemedText
                          type="defaultSemiBold"
                          style={[styles.linkButtonText, styles.deleteAccountButtonText]}
                        >
                          {deleteAccountLoading ? "Deleting..." : "Delete Account"}
                        </ThemedText>
                      </Pressable>
                      <ThemedText type="muted" style={styles.deleteAccountHint}>
                        Permanently delete your account and remove access to Heartspirit.
                      </ThemedText>
                    </View>
                  )}

                  {deleteAccountError && authUser && (
                    <ThemedText style={[styles.inputLabel, { color: "rgba(255,100,100,0.9)", marginTop: 8 }]}>
                      {deleteAccountError}
                    </ThemedText>
                  )}
                </View>
              )}
            </TranslucentCard>

            <TranslucentCard style={styles.card}>
              <SectionHeader section="notifications" iconName="notifications" title="Notifications" />
              {openSections.notifications && (
                <View style={styles.sectionBody}>
                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLabel}>
                      <ThemedText type="defaultSemiBold" style={styles.toggleTitle}>
                        Community Circles
                      </ThemedText>
                      <ThemedText type="muted" style={styles.toggleSubtitle}>
                        New circles and upcoming circle reminders
                      </ThemedText>
                    </View>
                    <Switch
                      value={communityCircles}
                      onValueChange={async (v: boolean) => {
                        setCommunityCircles(v)
                        await updateCircleReminderPrefs(v, v)
                      }}
                    />
                  </View>

                  {osNotifGranted !== null ? (
                    <View style={styles.permissionStatusBlock}>
                      {pushDiagnosticsVisible ? (
                        <>
                          <ThemedText type="muted" style={styles.permissionStatusText}>
                            OS permission: {osNotifGranted ? "Granted" : "Denied"}
                          </ThemedText>
                          <ThemedText
                            type="muted"
                            style={[
                              styles.permissionStatusText,
                              osNotifGranted &&
                              pushSyncSnapshot?.ok &&
                              pushSyncSnapshot.dbRegistered
                                ? styles.pushStatusOk
                                : osNotifGranted
                                  ? styles.pushStatusWarn
                                  : null,
                            ]}
                          >
                            Push token registered:{" "}
                            {pushSyncLoading
                              ? "Checking…"
                              : pushSyncSnapshot?.ok && pushSyncSnapshot.dbRegistered
                                ? "Yes"
                                : "No"}
                          </ThemedText>
                          {pushSyncSnapshot?.tokenPrefix ? (
                            <ThemedText type="muted" style={styles.permissionHelperText}>
                              Token: {pushSyncSnapshot.tokenPrefix}
                            </ThemedText>
                          ) : null}
                          {pushSyncSnapshot?.at ? (
                            <ThemedText type="muted" style={styles.permissionHelperText}>
                              Last sync: {new Date(pushSyncSnapshot.at).toLocaleString()}
                            </ThemedText>
                          ) : null}
                          {pushSyncSnapshot?.errorMessage ? (
                            <ThemedText style={styles.pushSyncErrorText}>
                              Last sync error: {pushSyncSnapshot.errorMessage}
                            </ThemedText>
                          ) : null}
                          {osNotifGranted &&
                          (!pushSyncSnapshot?.ok || !pushSyncSnapshot.dbRegistered) ? (
                            <ThemedText type="muted" style={styles.permissionHelperText}>
                              System notifications are on, but this device is not registered for
                              remote circle alerts.
                            </ThemedText>
                          ) : null}
                        </>
                      ) : (
                        <ThemedText type="muted" style={styles.permissionStatusText}>
                          {osNotifGranted
                            ? "Phone notifications: Enabled"
                            : communityCircles
                              ? "Circle reminders are on in Heartspirit, but your phone is currently blocking notifications."
                              : "Phone notifications are disabled on this device."}
                        </ThemedText>
                      )}
                      {!osNotifGranted ? (
                        <ThemedText type="muted" style={styles.permissionHelperText}>
                          {STAY_IN_RHYTHM_PROMPT.body}
                        </ThemedText>
                      ) : null}
                      {!osNotifGranted ? (
                        <Pressable
                          style={styles.enableNotifButton}
                          onPress={() => {
                            void (async () => {
                              await enableNotificationsFromPrompt()
                              await refreshOsNotificationPermission()
                              await refreshPushRegistration(true)
                            })()
                          }}
                        >
                          <ThemedText type="defaultSemiBold" style={styles.enableNotifButtonText}>
                            Enable Notifications
                          </ThemedText>
                        </Pressable>
                      ) : pushDiagnosticsVisible ? (
                        <Pressable
                          style={styles.enableNotifButton}
                          disabled={pushSyncLoading}
                          onPress={() => {
                            void refreshPushRegistration(true)
                          }}
                        >
                          <ThemedText type="defaultSemiBold" style={styles.enableNotifButtonText}>
                            {pushSyncLoading ? "Syncing…" : "Sync push token"}
                          </ThemedText>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              )}
            </TranslucentCard>

            <TranslucentCard style={styles.card}>
              <SectionHeader section="privacy" iconName="shield" title="Privacy & Data" />
              {openSections.privacy && (
                <View style={styles.sectionBody}>
                  <ThemedText type="defaultSemiBold" style={styles.toggleTitle}>
                    What we keep
                  </ThemedText>
                  <View style={styles.bulletList}>
                    <ThemedText type="muted" style={styles.bullet}>
                      • Your email/ contact info (for account access + support)
                    </ThemedText>
                    <ThemedText type="muted" style={styles.bullet}>
                      • App content you stream is delivered from our servers
                    </ThemedText>
                    <ThemedText type="muted" style={styles.bullet}>
                      • Community content (only if you post in Circles)
                    </ThemedText>
                  </View>

                  <ThemedText type="defaultSemiBold" style={[styles.toggleTitle, { marginTop: 12 }]}>
                    What we don't keep
                  </ThemedText>
                  <View style={styles.bulletList}>
                    <ThemedText type="muted" style={styles.bullet}>
                      • Your ritual history are not stored on our servers
                    </ThemedText>
                    <ThemedText type="muted" style={styles.bullet}>
                      • We don't sell your personal data
                    </ThemedText>
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLabel}>
                      <ThemedText type="defaultSemiBold" style={styles.toggleTitle}>
                        Save my history on this device
                      </ThemedText>
                      <ThemedText type="muted" style={styles.toggleSubtitle}>
                        Keeps your ritual history stored locally.
                      </ThemedText>
                    </View>
                    <Switch value={saveHistoryOnDevice} onValueChange={setSaveHistoryOnDevice} />
                  </View>

                  <Pressable style={styles.linkButton} onPress={handleExportData}>
                    <MaterialIcons name="download" size={18} color="rgba(255,255,255,0.9)" />
                    <ThemedText type="defaultSemiBold" style={styles.linkButtonText}>
                      Export My Data
                    </ThemedText>
                  </Pressable>

                  <Pressable style={[styles.linkButton, styles.destructiveLink]} onPress={handleClearHistory}>
                    <MaterialIcons name="delete" size={18} color="rgba(255,150,150,0.95)" />
                    <ThemedText
                      type="defaultSemiBold"
                      style={[styles.linkButtonText, { color: "rgba(255,150,150,0.95)" }]}
                    >
                      Clear Local History
                    </ThemedText>
                  </Pressable>

                  <ThemedText type="muted" style={styles.footnote}>
                    Clearing local history removes ritual completion and check-ins from this device. This
                    can't be undone.
                  </ThemedText>
                </View>
              )}
            </TranslucentCard>

            <TranslucentCard style={styles.card}>
              <SectionHeader section="support" iconName="help-outline" title="Support & Legal" />
              {openSections.support && (
                <View style={styles.sectionBody}>
                  <Pressable style={styles.linkButton} onPress={() => router.push("/support" as never)}>
                    <ThemedText type="defaultSemiBold" style={styles.linkButtonText}>
                      Help
                    </ThemedText>
                  </Pressable>

                  <Pressable style={styles.linkButton} onPress={() => router.push("/privacy" as never)}>
                    <ThemedText type="defaultSemiBold" style={styles.linkButtonText}>
                      Privacy Policy
                    </ThemedText>
                  </Pressable>

                  <Pressable style={styles.linkButton} onPress={() => router.push("/terms" as never)}>
                    <ThemedText type="defaultSemiBold" style={styles.linkButtonText}>
                      Terms of Use
                    </ThemedText>
                  </Pressable>
                </View>
              )}
            </TranslucentCard>
        </Animated.ScrollView>
      </ScreenContent>
      <BottomFade />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { gap: 12 },
  headerBlock: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  headerTitle: { fontSize: 24, fontWeight: "600" },
  headerSubtitle: { marginTop: 6 },
  card: { paddingVertical: 8 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: { fontSize: 16 },
  aboutBody: { gap: 10 },
  aboutText: { fontSize: 14, lineHeight: 21 },
  aboutLinkText: {
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.94,
  },
  aboutLinkGlyph: {
    fontSize: 12,
    lineHeight: 21,
    opacity: 0.62,
  },
  sectionBody: { paddingHorizontal: 4, paddingTop: 4, paddingBottom: 12 },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  profileStack: { marginBottom: 12, gap: 10 },
  profileInfoBlock: { width: "100%" },
  profileActions: { flexDirection: "row", gap: 8 },
  profileActionsRow: { flexDirection: "row", gap: 8 },
  profileInfo: { flex: 1 },
  signOutButton: { backgroundColor: "rgba(255,80,80,0.35)" },
  profileName: { fontSize: 14 },
  profileEmail: { fontSize: 12, marginTop: 2 },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(120, 170, 140, 0.65)",
  },
  editButtonText: { fontSize: 14, color: "white" },
  editForm: { gap: 4 },
  inputLabel: { fontSize: 12, marginBottom: 4 },
  inputHint: { fontSize: 11, marginTop: 4 },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "white",
  },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  cancelButtonText: { color: "white" },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "rgba(120, 170, 140, 0.65)",
    alignItems: "center",
  },
  saveButtonText: { color: "white" },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  toggleLabel: { flex: 1, marginRight: 12 },
  toggleTitle: { fontSize: 14 },
  toggleSubtitle: { fontSize: 12, marginTop: 2 },
  permissionStatusBlock: {
    marginTop: -8,
    marginBottom: 4,
    gap: 10,
  },
  permissionStatusText: {
    fontSize: 12,
    lineHeight: 18,
  },
  permissionHelperText: {
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.72,
  },
  pushStatusOk: {
    color: "rgba(140, 220, 170, 0.95)",
  },
  pushStatusWarn: {
    color: "rgba(255, 200, 120, 0.95)",
  },
  pushSyncErrorText: {
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255, 140, 140, 0.95)",
  },
  enableNotifButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(47, 143, 78, 0.9)",
  },
  enableNotifButtonText: {
    color: "#fff",
    fontSize: 13,
  },
  bulletList: { marginTop: 4 },
  bullet: { fontSize: 12, marginBottom: 4 },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    marginBottom: 4,
  },
  linkButtonText: { fontSize: 14 },
  destructiveLink: {},
  footnote: { fontSize: 11, marginTop: 12 },
  deleteAccountWrap: { marginTop: 8 },
  deleteAccountButton: {
    marginBottom: 0,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,130,130,0.35)",
    backgroundColor: "rgba(120,30,30,0.18)",
  },
  deleteAccountButtonText: { color: "rgba(255,160,160,0.98)" },
  deleteAccountHint: { fontSize: 11, marginTop: 6 },
})