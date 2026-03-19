import * as React from "react"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

/** Tab bar height (matches _layout.tsx) and gap above it. Single source of truth for tab-screen bottom spacing. */
export const TAB_BAR_HEIGHT = 56
export const TAB_BAR_GAP = 5

/** Bottom padding for tab screens: clears tab bar + safe area + small gap. Use for ScreenContent and scroll contentContainerStyle. */
export function getTabBarBottomPadding(insets: { bottom: number }): number {
  return TAB_BAR_HEIGHT + insets.bottom + TAB_BAR_GAP
}

export default function ScreenContent({
  children,
  style,
  noTabPadding,
  bottomPaddingOverride,
}: {
  children: React.ReactNode
  style?: any
  noTabPadding?: boolean
  bottomPaddingOverride?: number
}) {
  const insets = useSafeAreaInsets()
  const CONTENT_TOP = insets.top + 64

  const paddingBottom =
    typeof bottomPaddingOverride === "number"
      ? bottomPaddingOverride
      : noTabPadding
        ? insets.bottom + 24
        : getTabBarBottomPadding(insets)

  return (
    <View
      style={[
        {
          flex: 1,
          paddingHorizontal: 16,
          marginTop: CONTENT_TOP,
          paddingBottom,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}