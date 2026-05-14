import { Platform } from "react-native"

/** Brief Android-only delay so vertical ScrollViews win over large in-scroll Pressables. */
export const ANDROID_SCROLL_PRESS_DELAY = Platform.OS === "android" ? 80 : 0
