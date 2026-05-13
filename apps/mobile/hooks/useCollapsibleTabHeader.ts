import { useCallback } from "react"
import { useFocusEffect } from "@react-navigation/native"
import {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
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
 * Shared collapsible tab header: drives logo fade/slide + ScreenContent collapse
 * (GPU translateY) from this tab’s primary vertical scroll. Call only on main tab screens.
 */
export function useCollapsibleTabHeader(tabId: CollapsibleTabHeaderId) {
  const insets = useSafeAreaInsets()
  const { scrollY, activeDriverId } = useTabHeaderScroll()
  const localTabScrollY = useSharedValue(0)

  useFocusEffect(
    useCallback(() => {
      // Attach header animation to the active tab immediately on focus.
      scrollY.value = localTabScrollY.value
      activeDriverId.value = tabId
      return () => {
        // Prevent blur from a previous tab clobbering a newly-focused tab.
        if (activeDriverId.value === tabId) {
          activeDriverId.value = ""
        }
      }
    }, [activeDriverId, localTabScrollY, scrollY, tabId])
  )

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: () => {
      // Re-assert active driver at interaction start (helps with delayed focus state on devices).
      activeDriverId.value = tabId
    },
    onScroll: (e) => {
      localTabScrollY.value = e.contentOffset.y
      if (activeDriverId.value === tabId) {
        scrollY.value = e.contentOffset.y
      }
    },
  })

  const collapseDelta =
    getTabScreenContentTopMargin(insets) - (insets.top + TAB_SCREEN_TOP_INSET_COLLAPSED)

  const animatedScreenOuterStyle = useAnimatedStyle(() => {
    const activeY =
      activeDriverId.value === tabId ? scrollY.value : localTabScrollY.value
    const y = Math.min(Math.max(activeY, 0), HOME_HEADER_SCROLL_RANGE)
    const t = interpolate(y, [0, HOME_HEADER_SCROLL_RANGE], [0, 1], Extrapolation.CLAMP)
    return {
      transform: [
        {
          translateY: interpolate(t, [0, 1], [collapseDelta, 0], Extrapolation.CLAMP),
        },
      ],
    }
  }, [collapseDelta, localTabScrollY, scrollY, activeDriverId, tabId])

  return { animatedScreenOuterStyle, scrollHandler }
}
