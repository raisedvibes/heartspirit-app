import * as React from "react"
import { View, type ViewStyle } from "react-native"
import Animated, { type AnimatedStyle } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

/** Extra space below safe area so tab screens clear the shared logo (max / uncollapsed top). */
export const TAB_SCREEN_TOP_INSET = 64

/**
 * Minimum extra space below safe area when Home collapses the shared header (animated min).
 * Small premium gap only; `insets.top` already clears status bar / dynamic island.
 */
export const TAB_SCREEN_TOP_INSET_COLLAPSED = 2

export function getTabScreenContentTopMargin(insets: { top: number }): number {
  return insets.top + TAB_SCREEN_TOP_INSET
}

/** Tab bar height (matches _layout.tsx) and gap above it. Single source of truth for tab-screen bottom spacing. */
export const TAB_BAR_HEIGHT = 56
export const TAB_BAR_GAP = 5

/**
 * Premium scroll tail below the last item when the tab root uses `bottomPaddingOverride={0}`.
 * Tab bar + home indicator + calm gap so content never feels trapped behind the dock.
 * Do not combine with ScreenContent `paddingBottom` in that pattern (single source).
 */
export const PREMIUM_TAB_SCROLL_END_PADDING = 28

/** Stack screens (e.g. practice) sit above the tab bar — only safe area + breathing room below content. */
export const PREMIUM_STACK_SCROLL_BOTTOM_PADDING = 28

/** Bottom padding for ScreenContent when not using scroll `contentContainerStyle` clearance (e.g. non-tab). */
export function getTabBarBottomPadding(insets: { bottom: number }): number {
  return TAB_BAR_HEIGHT + insets.bottom + TAB_BAR_GAP
}

/** Use on ScrollView/FlatList `contentContainerStyle` for authenticated tab roots with `bottomPaddingOverride={0}`. */
export function getTabScrollContentBottomPadding(insets: { bottom: number }): number {
  return TAB_BAR_HEIGHT + insets.bottom + PREMIUM_TAB_SCROLL_END_PADDING
}

/** Use on stack/modal scroll roots (no tab bar). */
export function getStackScrollContentBottomPadding(insets: { bottom: number }): number {
  return insets.bottom + PREMIUM_STACK_SCROLL_BOTTOM_PADDING
}

export default function ScreenContent({
  children,
  style,
  noTabPadding,
  bottomPaddingOverride,
  /** When set, inner wrapper animates translateY for header collapse; outer uses collapsed top inset. */
  animatedOuterStyle,
}: {
  children: React.ReactNode
  style?: any
  noTabPadding?: boolean
  bottomPaddingOverride?: number
  animatedOuterStyle?: AnimatedStyle<ViewStyle>
}) {
  const insets = useSafeAreaInsets()
  const contentTop = getTabScreenContentTopMargin(insets)
  const contentTopCollapsed = insets.top + TAB_SCREEN_TOP_INSET_COLLAPSED

  const paddingBottom =
    typeof bottomPaddingOverride === "number"
      ? bottomPaddingOverride
      : noTabPadding
        ? insets.bottom + 24
        : getTabBarBottomPadding(insets)

  const base = {
    flex: 1,
    backgroundColor: "transparent" as const,
    paddingHorizontal: 16,
    paddingBottom,
  }

  if (animatedOuterStyle) {
    return (
      <View
        style={[
          base,
          { marginTop: contentTopCollapsed, overflow: "hidden" as const },
          style,
        ]}
      >
        <Animated.View style={[{ flex: 1 }, animatedOuterStyle]}>{children}</Animated.View>
      </View>
    )
  }

  return (
    <View style={[base, { marginTop: contentTop }, style]}>
      {children}
    </View>
  )
}
