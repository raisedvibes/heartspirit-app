// Android / web: match iOS outline icons via Ionicons (see icon-symbol.ios.tsx).

import { Ionicons } from "@expo/vector-icons"
import type { ComponentProps } from "react"
import { View, StyleSheet } from "react-native"
import type { OpaqueColorValue, StyleProp, TextStyle } from "react-native"

type IoniconName = ComponentProps<typeof Ionicons>["name"]

const MAPPING: Record<string, IoniconName> = {
  "home-outline": "home-outline",
  "battery-charging-outline": "battery-charging-outline",
  "flame-outline": "flame-outline",
  "people-outline": "people-outline",
  "settings-outline": "settings-outline",

  home: "home-outline",
  sparkles: "sparkles-outline",
  people: "people-outline",
  gearshape: "settings-outline",

  house: "home-outline",
  "house.fill": "home",
  Home: "home-outline",
  BatteryCharging: "battery-charging-outline",
  Flame: "flame-outline",
  NotebookText: "book-outline",
  Users: "people-outline",
  paperplane: "paper-plane-outline",
  "paperplane.fill": "paper-plane",
  magnifyingglass: "search-outline",
  "gearshape.fill": "settings",
  person: "person-outline",
  "person.fill": "person",
  plus: "add",
  xmark: "close",
  chevron_left: "chevron-back",
  chevron_right: "chevron-forward",
  "chevron.right": "chevron-forward",
  "chevron.left.forwardslash.chevron.right": "code-slash-outline",

  drop: "water-outline",
  cloud: "cloud-outline",
  moon: "moon-outline",
  bolt: "flash-outline",
  do_not_disturb_on: "remove-circle-outline",
  warning_amber: "warning-outline",
  thunderstorm: "thunderstorm-outline",
  "face.dashed": "sad-outline",
  "exclamationmark.circle": "alert-circle-outline",
  Foggy: "cloud-outline",
  Tired: "moon-outline",
  Anxious: "alert-circle-outline",
  Irritable: "skull-outline",
  Energized: "flash-outline",
  Calm: "water-outline",
}

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight: _weight,
}: {
  name: string
  size?: number
  color: string | OpaqueColorValue
  style?: StyleProp<TextStyle>
  /** Accepted for API parity with template / iOS; Ionicons outline set ignores weight. */
  weight?: string
}) {
  const iconName = (MAPPING[name] ?? "alert-circle-outline") as IoniconName
  return (
    <View style={styles.iconContainer}>
      <Ionicons name={iconName} size={size} color={color as string} style={style} />
    </View>
  )
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
})
