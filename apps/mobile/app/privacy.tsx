import { router } from "expo-router"
import { View, StyleSheet, ImageBackground, Pressable, Linking, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import ScreenContent from "@/components/layout/ScreenContent"
import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require("@/assets/images/fern_background.png")}
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
                  Privacy Policy
                </ThemedText>
              </View>
            </View>

            <TranslucentCard style={styles.card}>
              <View style={styles.section}>
                <ThemedText type="title" style={styles.mainTitle}>
                  Privacy Policy
                </ThemedText>
                <ThemedText type="muted" style={styles.effectiveDate}>
                  Effective date: January 26, 2026
                </ThemedText>
              </View>

              <ThemedText type="muted" style={styles.para}>
                Heartspirit is built as a privacy-first wellness application. We collect only what is
                necessary to operate the service and provide support. Your private wellness content
                (like ritual history and check-ins) is designed to remain on your device.
              </ThemedText>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  1) What We Collect
                </ThemedText>
                <View style={styles.bulletList}>
                  <ThemedText type="muted" style={styles.bullet}>
                    • <ThemedText type="defaultSemiBold" style={styles.bulletBold}>Contact information:</ThemedText>{" "}
                    such as email (for account access and support).
                  </ThemedText>
                  <ThemedText type="muted" style={styles.bullet}>
                    • <ThemedText type="defaultSemiBold" style={styles.bulletBold}>Community content (optional):</ThemedText>{" "}
                    if you choose to post in Circles (posts, comments, and related metadata).
                  </ThemedText>
                </View>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  2) What We Do Not Collect
                </ThemedText>
                <View style={styles.bulletList}>
                  <ThemedText type="muted" style={styles.bullet}>
                    • Your ritual history and check-ins are designed to remain on your device.
                  </ThemedText>
                  <ThemedText type="muted" style={styles.bullet}>
                    • We do not sell personal data.
                  </ThemedText>
                  <ThemedText type="muted" style={styles.bullet}>
                    • We do not run third-party ad tracking or data brokerage.
                  </ThemedText>
                </View>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  3) How Your Data Is Stored
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  Heartspirit uses a hybrid storage model:
                </ThemedText>
                <View style={styles.bulletList}>
                  <ThemedText type="muted" style={styles.bullet}>
                    • <ThemedText type="defaultSemiBold" style={styles.bulletBold}>On-device storage:</ThemedText>{" "}
                    Ritual completion, check-ins, and personal reflections are stored locally on your device.
                  </ThemedText>
                  <ThemedText type="muted" style={styles.bullet}>
                    • <ThemedText type="defaultSemiBold" style={styles.bulletBold}>Server storage:</ThemedText>{" "}
                    App content (such as practices, audio/video media URLs, and app updates) are delivered from our
                    servers. If you participate in community features, your posts may be stored so they can be
                    displayed to others.
                  </ThemedText>
                </View>
                <ThemedText type="muted" style={styles.para}>
                  If you delete the app, clear browser/app storage, or change devices, on-device data may be
                  permanently lost unless you export it.
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  4) Analytics & Tracking
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  We do not use third-party advertising trackers (such as ad pixels) to track you across other
                  apps or websites. If analytics are used in the future, we will update this policy and provide
                  clear options where required.
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  5) How We Use Your Data
                </ThemedText>
                <View style={styles.bulletList}>
                  <ThemedText type="muted" style={styles.bullet}>• To provide account access and service functionality</ThemedText>
                  <ThemedText type="muted" style={styles.bullet}>• To respond to support requests</ThemedText>
                  <ThemedText type="muted" style={styles.bullet}>• To provide community features you choose to use</ThemedText>
                  <ThemedText type="muted" style={styles.bullet}>• To keep the platform safe and prevent misuse</ThemedText>
                </View>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  6) Your Choices & Controls
                </ThemedText>
                <View style={styles.bulletList}>
                  <ThemedText type="muted" style={styles.bullet}>• You can clear local history in the app settings.</ThemedText>
                  <ThemedText type="muted" style={styles.bullet}>• You can export your local data from the app.</ThemedText>
                  <ThemedText type="muted" style={styles.bullet}>
                    • If you use community features, you may request deletion of your posts by contacting support.
                  </ThemedText>
                </View>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  7) Data Security
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  We take reasonable measures to protect the platform. However, no method of storage or transmission
                  is 100% secure. You are responsible for maintaining the security of your device and access to
                  your account.
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  8) Children's Privacy
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  Heartspirit is not intended for children under 13. If you believe a child has provided us
                  personal information, contact us and we will delete it.
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  9) Contact Us
                </ThemedText>
                <ThemedText type="muted" style={styles.para}>
                  If you have questions or requests about privacy, contact:
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
                We may update this policy as Heartspirit evolves. Updates will be posted on this page.
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
  bulletBold: { fontSize: 14 },
  contactRow: { marginTop: 4 },
  link: { textDecorationLine: "underline" },
  footnote: { fontSize: 12, marginTop: 8 },
})
