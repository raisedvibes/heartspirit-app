import type { UserSettings } from "@/types/user-settings"

// Default settings for new users
export const defaultUserSettings: Omit<UserSettings, "id" | "userId" | "timestamps"> = {
  profile: {
    name: "User",
    email: "user@example.com",
    profilePicUrl: undefined,
  },
  notifications: {
    dailyCheckIn: {
      enabled: true,
      time: "09:00",
    },
    weeklyReport: {
      enabled: true,
    },
    communityCircles: {
      enabled: false,
    },
  },
  personalization: {
    theme: "system",
    focusWord: "Peace",
  },
  tracking: {
    ritualHistoryEnabled: true,
    lastCheckInDate: undefined,
    streakCount: 0,
  },
  dataManagement: {
    allowExport: true,
    allowClear: false,
  },
  support: {
    contactSupportUrl: "mailto:support@heartspirit.app",
    privacyPolicyUrl: "/privacy",
    termsOfUseUrl: "/terms",
  },
}

// Utility functions for local storage (temporary solution)
export const getUserSettingsFromStorage = (userId: string): UserSettings | null => {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(`userSettings_${userId}`)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error("Error reading user settings from storage:", error)
    return null
  }
}

export const saveUserSettingsToStorage = (settings: UserSettings): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(`userSettings_${settings.userId}`, JSON.stringify(settings))
  } catch (error) {
    console.error("Error saving user settings to storage:", error)
  }
}

export const createDefaultUserSettings = (userId: string): UserSettings => {
  const now = new Date().toISOString()

  return {
    id: `settings_${userId}_${Date.now()}`,
    userId,
    ...defaultUserSettings,
    timestamps: {
      createdAt: now,
      updatedAt: now,
    },
  }
}
