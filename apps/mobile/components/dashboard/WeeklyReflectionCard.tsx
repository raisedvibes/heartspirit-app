import { StyleSheet } from "react-native"
import TranslucentCard from "@/components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"

type Props = {
  title: string
  reflection: string
}

export function WeeklyReflectionCard({ title, reflection }: Props) {
  if (!reflection.trim()) return null

  return (
    <TranslucentCard style={styles.card}>
      <ThemedText type="defaultSemiBold" style={styles.title}>
        {title || "This week"}
      </ThemedText>
      <ThemedText type="muted" style={styles.body}>
        {reflection}
      </ThemedText>
    </TranslucentCard>
  )
}

const styles = StyleSheet.create({
  card: { padding: 14 },
  title: { fontSize: 16 },
  body: { marginTop: 8, fontSize: 14, lineHeight: 20 },
})
