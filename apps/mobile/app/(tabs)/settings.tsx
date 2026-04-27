import { useState, useEffect } from "react"
import { router } from "expo-router"
import { View, StyleSheet, Pressable, Switch, TextInput } from "react-native"
import Animated from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import ScreenContent, { getTabBarBottomPadding } from "@/components/layout/ScreenContent"
import { useCollapsibleTabHeader } from "@/hooks/useCollapsibleTabHeader"
import TranslucentCard from "@/components/ui/TranslucentCard"
import BottomFade from "@/components/ui/BottomFade"
import { ThemedText } from "@/components/themed-text"
import { getSupabaseClient } from "@/lib/supabaseClient"
import {
  loadCircleReminderPrefs,
  updateCircleReminderPrefs,
} from "@/lib/pushTokenRegistration"

type SectionKey = "profile" | "notifications" | "privacy" | "support"

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const { animatedScreenOuterStyle, scrollHandler } = useCollapsibleTabHeader("settings")

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    profile: false,
    notifications: false,
    privacy: false,
    support: false,
  })

  // Notifications
  const [dailyCheckIn, setDailyCheckIn] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(false)
  const [communityCircles, setCommunityCircles] = useState(false)
  const [circlesWeekBefore, setCirclesWeekBefore] = useState(false)
  const [circlesDayBefore, setCirclesDayBefore] = useState(false)
  const [checkInTime, setCheckInTime] = useState("09:00")
  const [notifPrefsLoading, setNotifPrefsLoading] = useState(true)

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

  // Privacy / local data
  const [saveHistoryOnDevice, setSaveHistoryOnDevice] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setProfileLoading(false)
      setNotifPrefsLoading(false)
      return
    }

    const init = async () => {
      setProfileLoading(true)
      setNotifPrefsLoading(true)
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
          setDailyCheckIn(prof.notif_rituals_enabled ?? false)
          setCirclesWeekBefore(prof.notif_circles_week_before ?? false)
          setCirclesDayBefore(prof.notif_circles_day_before ?? false)
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
          setDailyCheckIn(false)
          setCirclesWeekBefore(false)
          setCirclesDayBefore(false)

          const { error: upsertErr } = await supabase.from("profiles").upsert({
            id: user.id,
            display_name: fallbackDisplayName || null,
            full_name: metadataFullName || null,
            email: user.email ?? null,
          })
          if (upsertErr) {
            console.log("[Settings] profile upsert on init:", upsertErr.message)
          }
        }
      } else {
        setProfile({ display_name: "", full_name: "", email: "" })
        setEditingProfile(false)

        const prefs = await loadCircleReminderPrefs()
        setCirclesWeekBefore(prefs.weekBefore)
        setCirclesDayBefore(prefs.dayBefore)
      }

      setProfileLoading(false)
      setNotifPrefsLoading(false)
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

  const updateNotifRitualsEnabled = async (enabled: boolean) => {
    setDailyCheckIn(enabled)
    const supabase = getSupabaseClient()
    if (!supabase || !authUser) return

    await supabase
      .from("profiles")
      .update({ notif_rituals_enabled: enabled })
      .eq("id", authUser.id)
  }

  const handleExportData = () => {
    console.log("Export data (local)")
  }

  const handleClearHistory = () => {
    console.log("Clear history (local)")
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
      <ScreenContent animatedOuterStyle={animatedScreenOuterStyle}>
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: getTabBarBottomPadding(insets) }]}
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
              <SectionHeader section="profile" iconName="person" title="Profile & Contact" />
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
                    <View style={styles.profileRow}>
                      <View style={styles.profileInfo}>
                        <ThemedText type="defaultSemiBold" style={styles.profileName}>
                          {profile.display_name || "Your name"}
                        </ThemedText>
                        <ThemedText type="muted" style={styles.profileEmail}>
                          {profile.email || authUser.email || "your@email.com"}
                        </ThemedText>
                      </View>
                      <View style={styles.profileActions}>
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
                    We only use your contact info for account access and support. Your ritual history and
                    check-ins stay on your device.
                  </ThemedText>
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
                        Daily Check-In
                      </ThemedText>
                      <ThemedText type="muted" style={styles.toggleSubtitle}>
                        Remind me to check in daily
                      </ThemedText>
                    </View>
                    <Switch
                      value={dailyCheckIn}
                      onValueChange={(v: boolean) => updateNotifRitualsEnabled(v)}
                    />
                  </View>

                  {dailyCheckIn && (
                    <View style={styles.timeRow}>
                      <ThemedText type="defaultSemiBold" style={styles.toggleTitle}>
                        Reminder Time
                      </ThemedText>
                      <TextInput
                        style={[styles.input, styles.timeInput]}
                        value={checkInTime}
                        onChangeText={setCheckInTime}
                        placeholder="09:00"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                      />
                      <ThemedText type="muted" style={styles.toggleSubtitle}>
                        Reminders depend on device support.
                      </ThemedText>
                    </View>
                  )}

                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLabel}>
                      <ThemedText type="defaultSemiBold" style={styles.toggleTitle}>
                        Weekly Reflection
                      </ThemedText>
                      <ThemedText type="muted" style={styles.toggleSubtitle}>
                        A gentle weekly recap (generated on your device)
                      </ThemedText>
                    </View>
                    <Switch value={weeklyReport} onValueChange={setWeeklyReport} />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLabel}>
                      <ThemedText type="defaultSemiBold" style={styles.toggleTitle}>
                        Community Circles
                      </ThemedText>
                      <ThemedText type="muted" style={styles.toggleSubtitle}>
                        Circle activity notifications
                      </ThemedText>
                    </View>
                    <Switch value={communityCircles} onValueChange={setCommunityCircles} />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLabel}>
                      <ThemedText type="defaultSemiBold" style={styles.toggleTitle}>
                        Circle reminders: 7 days before
                      </ThemedText>
                      <ThemedText type="muted" style={styles.toggleSubtitle}>
                        Get notified a week before a circle starts
                      </ThemedText>
                    </View>
                    <Switch
                      value={circlesWeekBefore}
                      onValueChange={async (v: boolean) => {
                        setCirclesWeekBefore(v)
                        await updateCircleReminderPrefs(v, circlesDayBefore)
                      }}
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLabel}>
                      <ThemedText type="defaultSemiBold" style={styles.toggleTitle}>
                        Circle reminders: 1 day before
                      </ThemedText>
                      <ThemedText type="muted" style={styles.toggleSubtitle}>
                        Get notified the day before a circle starts
                      </ThemedText>
                    </View>
                    <Switch
                      value={circlesDayBefore}
                      onValueChange={async (v: boolean) => {
                        setCirclesDayBefore(v)
                        await updateCircleReminderPrefs(circlesWeekBefore, v)
                      }}
                    />
                  </View>
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
                      • Your email/contact info (for account access + support)
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
                      • Your ritual history and check-ins are not stored on our servers
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
                        Keeps your check-ins and ritual history stored locally.
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
  sectionBody: { paddingHorizontal: 4, paddingTop: 4, paddingBottom: 12 },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  profileActions: { flexDirection: "row", gap: 8 },
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
  timeInput: { width: 100 },
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
  timeRow: { marginBottom: 16 },
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
})