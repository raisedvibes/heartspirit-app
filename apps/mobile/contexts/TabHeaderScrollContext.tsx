import React, { createContext, useContext, useMemo } from "react"
import { useSharedValue, type SharedValue } from "react-native-reanimated"

/** Home vertical scroll (px) over which the shared logo and Home content top inset collapse together. */
export const HOME_HEADER_SCROLL_RANGE = 56

export type TabHeaderScrollContextValue = {
  /** Vertical offset of the focused tab’s primary vertical scroll (px). */
  scrollY: SharedValue<number>
  /** Stable id for the currently focused tab that drives collapse, or empty string when inactive. */
  activeDriverId: SharedValue<string>
}

const TabHeaderScrollContext = createContext<TabHeaderScrollContextValue | null>(null)

export function TabHeaderScrollProvider({ children }: { children: React.ReactNode }) {
  const scrollY = useSharedValue(0)
  const activeDriverId = useSharedValue("")

  const value = useMemo(
    () => ({ scrollY, activeDriverId }),
    [scrollY, activeDriverId],
  )

  return <TabHeaderScrollContext.Provider value={value}>{children}</TabHeaderScrollContext.Provider>
}

export function useTabHeaderScroll(): TabHeaderScrollContextValue {
  const ctx = useContext(TabHeaderScrollContext)
  if (!ctx) {
    throw new Error("useTabHeaderScroll must be used within TabHeaderScrollProvider")
  }
  return ctx
}
