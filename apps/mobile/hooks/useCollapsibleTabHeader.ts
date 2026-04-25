import { useEffect } from "react"
import { useIsFocused } from "@react-navigation/native"
import {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  getTabScreenContentTopMargin,
  TAB_SCREEN_TOP_INSET_COLLAPSED,
} from "@/components/layout/ScreenContent"
import { HOME_HEADER_SCROLL_RANGE, useTabHeaderScroll } from "@/contexts/TabHeaderScrollContext"

export type CollapsibleTabHeaderId =
  | "home"
  | "energy"
  | "rituals"
  | "circles"
  | "settings"

/**
 * Shared collapsible tab header: drives logo fade/slide + ScreenContent top inset
 * from this tab’s primary vertical scroll. Call only on main tab screens.
 */
export function useCollapsibleTabHeader(tabId: CollapsibleTabHeaderId) {
  const insets = useSafeAreaInsets()
  const { scrollY, activeDriverId } = useTabHeaderScroll()
  const isFocused = useIsFocused()

  useEffect(() => {
    if (!isFocused) return

    activeDriverId.value = tabId
    return () => {
      // Prevent blur from a previous tab clobbering a newly-focused tab.
      if (activeDriverId.value === tabId) {
        activeDriverId.value = ""
      }
    }
  }, [isFocused, tabId, activeDriverId])

  const contentTopMax = getTabScreenContentTopMargin(insets)
  const contentTopMin = insets.top + TAB_SCREEN_TOP_INSET_COLLAPSED

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y
    },
  })

  const animatedScreenOuterStyle = useAnimatedStyle(() => {
    const y = Math.min(Math.max(scrollY.value, 0), HOME_HEADER_SCROLL_RANGE)
    const t = interpolate(y, [0, HOME_HEADER_SCROLL_RANGE], [0, 1], Extrapolation.CLAMP)
    return {
      marginTop: interpolate(t, [0, 1], [contentTopMax, contentTopMin]),
    }
  }, [contentTopMax, contentTopMin])

  return { animatedScreenOuterStyle, scrollHandler }
}
