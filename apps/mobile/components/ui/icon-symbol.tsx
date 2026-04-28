// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import type { ComponentProps } from "react"
import { View, StyleSheet } from "react-native"
import type { OpaqueColorValue, StyleProp, TextStyle } from "react-native"

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"]

/**
 * Add your SF Symbols and custom names to Material Icons mappings here.
 * - see Material Icons in the Icons Directory (https://icons.expo.fyi)
 * - see SF Symbols in the SF Symbols app
 */
const MAPPING: Record<string, MaterialIconName> = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",

  home: "home",
  sparkles: "auto-awesome",
  people: "people",
  gearshape: "settings",
  // SF Symbol / custom names (EnergyCheck, etc.)
  drop: "opacity",
  cloud: "cloud",
  moon: "nights-stay",
  bolt: "bolt",
  do_not_disturb_on: "do-not-disturb-on",
  warning_amber: "warning-amber",
  thunderstorm: "thunderstorm",
  "face.dashed": "sentiment-dissatisfied",
  "exclamationmark.circle": "report-problem",

  // Feelings (Energy Check)
  Calm: "waves",
  Foggy: "cloud",
  Tired: "nights-stay",
  Irritable: "smoking-rooms",
  Anxious: "warning",
  Energized: "bolt",
}

type IconSymbolName = keyof typeof MAPPING

/**
 * Icon component:
 * Uses Material Icons (Android/web). Names are mapped from SF Symbols / custom names.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName | string
  size?: number
  color: string | OpaqueColorValue
  style?: StyleProp<TextStyle>
}) {
  const iconName = MAPPING[name] ?? "report-problem"
  return (
    <View style={styles.iconContainer}>
      <MaterialIcons color={color} size={size} name={iconName} style={style} />
    </View>
  )
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
})