import { Linking, Pressable, StyleSheet } from "react-native"
import TranslucentCard from "@/components/ui/TranslucentCard"
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
        <Pressable
          onPress={openUrl}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <ThemedText type="defaultSemiBold" style={styles.ctaText}>
            {ctaLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </TranslucentCard>
  )
}

const styles = StyleSheet.create({
  card: { padding: 14 },
  title: { fontSize: 16 },
  body: { fontSize: 14, lineHeight: 20 },
  bodyAfterTitle: { marginTop: 8 },
  cta: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(120, 170, 140, 0.65)",
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: { color: "#ffffff", fontSize: 15 },
})
