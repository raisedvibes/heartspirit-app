import { Ionicons } from "@expo/vector-icons"
import type { ComponentProps } from "react"
import { View, StyleSheet } from "react-native"

type IoniconName = ComponentProps<typeof Ionicons>["name"]

export function IconSymbol({
  name,
  size = 24,
  color,
}: {
  name: string
  size?: number
  color: string
}) {
  // Best-effort mapping for common SF Symbol names used by Expo templates
  const map: Record<string, IoniconName> = {
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
    gearshape: "settings-outline",
    "gearshape.fill": "settings",
    person: "person-outline",
    "person.fill": "person",
    plus: "add",
    xmark: "close",
    chevron_left: "chevron-back",
    chevron_right: "chevron-forward",
    drop: "water-outline",
    cloud: "cloud-outline",
    moon: "moon-outline",
    bolt: "flash-outline",
    "face.dashed": "sad-outline",
    "exclamationmark.circle": "alert-circle-outline",
    Foggy: "cloud-outline",
    Tired: "moon-outline",
    Anxious: "alert-circle-outline",
    Irritable: "skull-outline",
    Energized: "flash-outline",
    Calm: "water-outline",
  }

  const iconName = (map[name] ?? "alert-circle-outline") as IoniconName
  return (
    <View style={styles.iconContainer}>
      <Ionicons name={iconName} size={size} color={color} />
    </View>
  )
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
})
