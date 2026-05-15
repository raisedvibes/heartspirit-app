import { Modal, Pressable, StyleSheet, View, Platform } from "react-native"
import { BlurView } from "expo-blur"
import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"

type NotificationPermissionModalProps = {
  visible: boolean
  title: string
  body: string
  /** Optional small support line (e.g. volume + notifications reminder). */
  helperText?: string
  primaryLabel: string
  secondaryLabel: string
  onPrimary: () => void
  onSecondary: () => void
  onRequestClose: () => void
}

export function NotificationPermissionModal({
  visible,
  title,
  body,
  helperText,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onRequestClose,
}: NotificationPermissionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.root}>
        <BlurView
          intensity={Platform.OS === "ios" ? 62 : 50}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <Pressable accessibilityRole="button" style={styles.dim} onPress={onRequestClose} />
        <View style={styles.center} pointerEvents="box-none">
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.shell}>
            <TranslucentCard style={styles.card}>
              <ThemedText type="title" style={styles.title}>
                {title}
              </ThemedText>
              <ThemedText type="muted" style={styles.body}>
                {body}
              </ThemedText>
              {helperText ? (
                <ThemedText type="muted" style={styles.helper}>
                  {helperText}
                </ThemedText>
              ) : null}
              <Pressable onPress={onPrimary} style={styles.primaryButton}>
                <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
                  {primaryLabel}
                </ThemedText>
              </Pressable>
              <Pressable onPress={onSecondary} style={styles.secondaryButton}>
                <ThemedText type="defaultSemiBold" style={styles.secondaryButtonText}>
                  {secondaryLabel}
                </ThemedText>
              </Pressable>
            </TranslucentCard>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  center: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  shell: { width: "100%", maxWidth: 400, alignSelf: "center" },
  card: { padding: 20, gap: 14 },
  title: { fontSize: 22, textAlign: "center" },
  body: { fontSize: 15, lineHeight: 22, textAlign: "center" },
  helper: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    opacity: 0.72,
    marginTop: -2,
  },
  primaryButton: {
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#2f8f4e",
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 15 },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: { color: "rgba(255,255,255,0.82)", fontSize: 14 },
})
