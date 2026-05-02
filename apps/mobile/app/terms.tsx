import { router } from "expo-router"
import { View, StyleSheet, ImageBackground, Pressable, Linking, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import ScreenContent from "@/components/layout/ScreenContent"
import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"

export default function TermsScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require("@/assets/images/fern.background.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <ScreenContent bottomPaddingOverride={0}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={22} color="rgba(255,255,255,0.9)" />
                <ThemedText type="defaultSemiBold" style={styles.backText}>
                  Settings
                </ThemedText>
              </Pressable>
              <View style={styles.headerBlock}>
                <ThemedText type="title" style={styles.headerTitle}>
                  Terms of Use
                </ThemedText>
              </View>
            </View>

            <TranslucentCard style={styles.card}>
              <View style={styles.section}>
                <ThemedText type="title" style={styles.mainTitle}>
                  Terms of Use
                </ThemedText>
                <ThemedText type="muted" style={styles.effectiveDate}>
                  Effective date: January 26, 2026
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  1) Acceptance of These Terms
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  By accessing or using Heartspirit ("the App"), you agree to these Terms of Use. If you do not
                  agree, do not use the App.
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  2) Wellness Disclaimer
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  Heartspirit provides educational and wellness content (such as breathwork, rituals, reflection prompts,
                  and guided practices). The App is not a medical service and does not provide medical advice,
                  diagnosis, or treatment.
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  Always consult a qualified healthcare professional regarding any medical condition. If you are
                  experiencing a medical emergency, call emergency services immediately.
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  3) Eligibility
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  You must be at least 13 years old to use the App.
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  4) Your Account
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  If you create an account, you are responsible for maintaining its security and for all activity
                  under your account. You agree to provide accurate information.
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  5) Acceptable Use
                </ThemedText>
                <View style={styles.bulletList}>
                  <ThemedText type="muted" style={styles.bullet}>• Do not use the App for unlawful purposes.</ThemedText>
                  <ThemedText type="muted" style={styles.bullet}>• Do not attempt to reverse engineer, disrupt, or exploit the App.</ThemedText>
                  <ThemedText type="muted" style={styles.bullet}>• Do not post abusive, harmful, or infringing content in community spaces.</ThemedText>
                  <ThemedText type="muted" style={styles.bullet}>• Respect the privacy and wellbeing of other community members.</ThemedText>
                </View>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  6) Community Content (Circles)
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  If you post content to community areas, you understand it may be visible to other users. You are
                  responsible for what you share, including ensuring you do not post sensitive personal information
                  you do not want to be public.
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  We may remove content that violates these Terms or creates harm in the community.
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  7) Intellectual Property
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  The App and its content (including text, audio, video, design, and branding) are owned by Heartspirit
                  or its licensors and are protected by applicable laws. You may not copy or redistribute content
                  outside of personal use without written permission.
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  8) Termination
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  We may suspend or terminate access to the App if you violate these Terms or misuse the platform.
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  9) Limitation of Liability
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  To the fullest extent permitted by law, Heartspirit shall not be liable for indirect, incidental,
                  special, consequential, or punitive damages, or any loss of data, arising from your use of the App.
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  10) Changes to These Terms
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  We may update these Terms from time to time. Updated Terms will be posted on this page.
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  11) Contact
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  For questions about these Terms, please contact:
                </ThemedText>
                <ThemedText type="default" style={styles.contactRow}>
                  <ThemedText
                    type="default"
                    style={styles.link}
                    onPress={() => Linking.openURL("mailto:support@heartspirit.earth")}
                  >
                    support@heartspirit.earth
                  </ThemedText>
                </ThemedText>
              </View>

              <ThemedText type="muted" style={styles.footnote}>
                Thank you for being in circle with Heartspirit.
              </ThemedText>
            </TranslucentCard>
          </ScrollView>
        </ScreenContent>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1 },
  scrollContent: { gap: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: { fontSize: 17 },
  headerBlock: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  headerTitle: { fontSize: 24, fontWeight: "600" },
  card: { padding: 20 },
  section: { marginBottom: 16 },
  mainTitle: { fontSize: 24, fontWeight: "600", marginBottom: 4 },
  effectiveDate: { fontSize: 14, marginBottom: 16 },
  sectionTitle: { fontSize: 16, marginBottom: 8 },
  para: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  bulletList: { marginBottom: 4 },
  bullet: { fontSize: 14, lineHeight: 22, marginBottom: 6, paddingLeft: 8 },
  contactRow: { marginTop: 4 },
  link: { textDecorationLine: "underline" },
  footnote: { fontSize: 12, marginTop: 8 },
})
