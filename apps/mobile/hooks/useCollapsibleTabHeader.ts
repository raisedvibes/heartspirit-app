import { useCallback } from "react"
import { Platform } from "react-native"
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

const IS_ANDROID = Platform.OS === "android"

/** Android: ignore sub-2px scroll delta so micro oscillations while the finger rests do not drive parent translateY (finger-hold jitter). */
const ANDROID_SCROLL_DEADBAND_PX = 2

/** Android: tiny contentOffset noise still rounds; deadband is the main stabilizer. */
function tabScrollYForCollapse(rawY: number): number {
  "worklet"
  if (!IS_ANDROID) return rawY
  return Math.round(rawY)
}

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
  /** Android: last Y committed to scrollY / localTabScrollY; blocks hold-time micro deltas. */
  const lastCommittedY = useSharedValue(0)

  useFocusEffect(
    useCallback(() => {
      // Attach header animation to the active tab immediately on focus.
      scrollY.value = localTabScrollY.value
      if (IS_ANDROID) {
        lastCommittedY.value = localTabScrollY.value
      }
      activeDriverId.value = tabId
      return () => {
        // Prevent blur from a previous tab clobbering a newly-focused tab.
        if (activeDriverId.value === tabId) {
          activeDriverId.value = ""
        }
      }
    }, [activeDriverId, lastCommittedY, localTabScrollY, scrollY, tabId])
  )

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: () => {
      // Re-assert active driver at interaction start (helps with delayed focus state on devices).
      activeDriverId.value = tabId
      if (IS_ANDROID) {
        // Align deadband baseline with last committed offset when a new gesture starts.
        lastCommittedY.value = localTabScrollY.value
      }
    },
    onScroll: (e) => {
      const y = tabScrollYForCollapse(e.contentOffset.y)
      if (IS_ANDROID) {
        const prev = lastCommittedY.value
        if (Math.abs(y - prev) < ANDROID_SCROLL_DEADBAND_PX) {
          return
        }
        lastCommittedY.value = y
      }
      localTabScrollY.value = y
      if (activeDriverId.value === tabId) {
        scrollY.value = y
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
    const translateY = interpolate(t, [0, 1], [collapseDelta, 0], Extrapolation.CLAMP)
    return {
      transform: [
        {
          translateY: IS_ANDROID ? Math.round(translateY) : translateY,
        },
      ],
    }
  }, [collapseDelta, localTabScrollY, scrollY, activeDriverId, tabId])

  return { animatedScreenOuterStyle, scrollHandler }
}
