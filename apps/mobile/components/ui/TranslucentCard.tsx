import React from "react"
import { StyleSheet, View, type ViewProps } from "react-native"
import { GLASS } from "@/components/ui/glass"

type Props = ViewProps & {
  children?: React.ReactNode
  tone?: "light" | "dark"
  /** Multiplies the base alpha (default keeps it dark). Range ~0.6–1.2 */
  opacity?: number
  className?: string
}

function withAlpha(rgba: string, alphaMultiplier: number) {
  // expects "rgba(r,g,b,a)"
  const m = rgba.match(
    /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/
  )
  if (!m) return rgba
  const r = Number(m[1])
  const g = Number(m[2])
  const b = Number(m[3])
  const a = Number(m[4])

  const nextA = Math.max(0, Math.min(1, a * alphaMultiplier))
  return `rgba(${r},${g},${b},${nextA})`
}

export default function TranslucentCard({
  children,
  style,
  tone = "dark",
  opacity = 1, // <-- key: no longer "0.1" (which would make things super faint)
  ...props
}: Props) {
  const baseBg = tone === "dark" ? GLASS.bgDark : GLASS.bgLight
  const baseBorder = tone === "dark" ? GLASS.borderDark : GLASS.borderLight

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: withAlpha(baseBg, opacity),
          borderColor: withAlpha(baseBorder, opacity),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
})