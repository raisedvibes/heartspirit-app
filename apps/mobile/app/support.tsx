import { router } from "expo-router"
import { View, StyleSheet, ImageBackground, Pressable, Linking, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import ScreenContent from "@/components/layout/ScreenContent"
import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"

const MAILTO_SUPPORT = "mailto:support@heartspirit.earth?subject=Heartspirit%20Support%20Request"
const MAILTO_BUG =
  "mailto:support@heartspirit.earth?subject=Bug%20Report%20(Heartspirit)&body=What%20happened%3F%0A%0ASteps%20to%20reproduce%3A%0A1.%20%0A2.%20%0A%0AWhat%20did%20you%20expect%20to%20happen%3F%0A%0ADevice%2FBrowser%3A%0A"

export default function SupportScreen() {
  const insets = useSafeAreaInsets()

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
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={22} color="rgba(255,255,255,0.9)" />
                <ThemedText type="defaultSemiBold" style={styles.backText}>
                  Settings
                </ThemedText>
              </Pressable>
              <View style={styles.headerBlock}>
                <ThemedText type="title" style={styles.headerTitle}>
                  Support
                </ThemedText>
              </View>
            </View>

            <TranslucentCard style={styles.card}>
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Need help?
                </ThemedText>
                <ThemedText type="muted" style={styles.sectionBody}>
                  Email us and we'll get back to you. If something feels urgent or medical, please contact a licensed
                  professional or emergency services.
                </ThemedText>
              </View>

              <View style={styles.buttonGroup}>
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => Linking.openURL(MAILTO_SUPPORT)}
                >
                  <MaterialIcons name="mail" size={18} color="white" />
                  <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
                    Email Support
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={styles.outlineButton}
                  onPress={() => Linking.openURL(MAILTO_BUG)}
                >
                  <MaterialIcons name="bug-report" size={18} color="rgba(255,255,255,0.9)" />
                  <ThemedText type="defaultSemiBold" style={styles.outlineButtonText}>
                    Report a Bug
                  </ThemedText>
                </Pressable>
              </View>

              <TranslucentCard style={styles.quickAnswersCard}>
                <ThemedText type="defaultSemiBold" style={styles.quickAnswersTitle}>
                  Quick answers
                </ThemedText>

                <View style={styles.faqItem}>
                  <ThemedText type="defaultSemiBold" style={styles.faqQuestion}>
                    Where is my data saved?
                  </ThemedText>
                  <ThemedText type="muted" style={styles.faqAnswer}>
                    Your check-ins and ritual history are stored locally on your device. If you delete the app or clear
                    storage, that data may be lost unless you export it first.
                  </ThemedText>
                </View>

                <View style={styles.faqItem}>
                  <ThemedText type="defaultSemiBold" style={styles.faqQuestion}>
                    Can you recover my data?
                  </ThemedText>
                  <ThemedText type="muted" style={styles.faqAnswer}>
                    Since your personal history stays on your device, we generally can't recover it if lost. Exporting your
                    data is the best way to keep a backup.
                  </ThemedText>
                </View>

                <View style={styles.faqItem}>
                  <ThemedText type="defaultSemiBold" style={styles.faqQuestion}>
                    What data do you keep?
                  </ThemedText>
                  <ThemedText type="muted" style={styles.faqAnswer}>
                    We keep only what's needed for account access and support (like your email). Practices/content are
                    delivered from our servers. Community posts are stored only if you choose to post.
                  </ThemedText>
                </View>
              </TranslucentCard>

              <View style={styles.linkGroup}>
                <Pressable
                  style={styles.outlineButton}
                  onPress={() => router.push("/privacy" as never)}
                >
                  <MaterialIcons name="shield" size={18} color="rgba(255,255,255,0.9)" />
                  <ThemedText type="defaultSemiBold" style={styles.outlineButtonText}>
                    Privacy Policy
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={styles.outlineButton}
                  onPress={() => router.push("/terms" as never)}
                >
                  <MaterialIcons name="description" size={18} color="rgba(255,255,255,0.9)" />
                  <ThemedText type="defaultSemiBold" style={styles.outlineButtonText}>
                    Terms of Use
                  </ThemedText>
                </Pressable>
              </View>

          
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
  scrollContent: { gap: 16, paddingTop: 8 },
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
  sectionTitle: { fontSize: 16, marginBottom: 4 },
  sectionBody: { fontSize: 14, lineHeight: 20 },
  buttonGroup: { gap: 10, marginBottom: 20 },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(120, 170, 140, 0.65)",
  },
  primaryButtonText: { fontSize: 14, color: "white" },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  outlineButtonText: { fontSize: 14 },
  quickAnswersCard: {
    padding: 16,
    marginBottom: 16,
  },
  quickAnswersTitle: { fontSize: 14, marginBottom: 12 },
  faqItem: { marginBottom: 16 },
  faqQuestion: { fontSize: 14, marginBottom: 4 },
  faqAnswer: { fontSize: 14, lineHeight: 20 },
  linkGroup: { gap: 10, marginBottom: 16 },
  footer: { fontSize: 12 },
  footerLink: { textDecorationLine: "underline" },
})
