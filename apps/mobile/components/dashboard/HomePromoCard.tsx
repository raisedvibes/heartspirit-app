import { Linking, Pressable, StyleSheet, View } from "react-native"
import TranslucentCard from "@/components/ui/TranslucentCard"
import { GLASS_OUTLINE_CTA } from "@/components/ui/glass"
import { ThemedText } from "@/components/themed-text"

export type HomePromoRow = {
  title: string | null
  body: string | null
  button_label: string | null
  url: string | null
}

function isValidExternalUrl(raw: string | null | undefined): boolean {
  if (!raw || typeof raw !== "string") return false
  const t = raw.trim()
  if (!t) return false
  try {
    const u = new URL(t)
    return u.protocol === "https:" || u.protocol === "http:"
  } catch {
    return false
  }
}

type Props = {
  promo: HomePromoRow
}

export function HomePromoCard({ promo }: Props) {
  const title = promo.title?.trim() ?? ""
  const body = promo.body?.trim() ?? ""
  if (!title && !body) return null

  const urlOk = isValidExternalUrl(promo.url)
  const ctaLabel = (promo.button_label?.trim() || "Learn more").trim()

  const openUrl = async () => {
    if (!urlOk || !promo.url) return
    try {
      await Linking.openURL(promo.url.trim())
    } catch {
      // ignore failed opens
    }
  }

  return (
    <TranslucentCard style={styles.card}>
      {title ? (
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {title}
        </ThemedText>
      ) : null}
      {body ? (
        <ThemedText type="muted" style={[styles.body, title ? styles.bodyAfterTitle : null]}>
          {body}
        </ThemedText>
      ) : null}
      {urlOk ? (
        <View style={styles.footerRow}>
          <Pressable
            onPress={openUrl}
            style={({ pressed }) => [
              GLASS_OUTLINE_CTA.button,
              pressed && styles.ctaPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
          >
            <ThemedText type="defaultSemiBold" style={GLASS_OUTLINE_CTA.buttonText}>
              {ctaLabel}
            </ThemedText>
          </Pressable>
        </View>
      ) : null}
    </TranslucentCard>
  )
}

const styles = StyleSheet.create({
  card: { padding: 14 },
  title: { fontSize: 16 },
  body: { fontSize: 14, lineHeight: 20 },
  bodyAfterTitle: { marginTop: 8 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  ctaPressed: { opacity: 0.85 },
})
