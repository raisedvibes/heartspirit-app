import { type NextRequest, NextResponse } from "next/server"
import type { UserSettings, UserSettingsUpdate } from "@/types/user-settings"
import { getUserSettingsFromStorage, saveUserSettingsToStorage, createDefaultUserSettings } from "@/lib/user-settings"

// GET /api/user-settings - Retrieve user settings
export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd get the user ID from authentication
    // For now, using a default user ID
    const userId = "default_user"

    let settings = getUserSettingsFromStorage(userId)

    // If no settings exist, create default ones
    if (!settings) {
      settings = createDefaultUserSettings(userId)
      saveUserSettingsToStorage(settings)
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching user settings:", error)
    return NextResponse.json({ error: "Failed to fetch user settings" }, { status: 500 })
  }
}

// PUT /api/user-settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const updates: UserSettingsUpdate = await request.json()
    const userId = "default_user" // In a real app, get from auth

    let settings = getUserSettingsFromStorage(userId)

    // If no settings exist, create default ones first
    if (!settings) {
      settings = createDefaultUserSettings(userId)
    }

    // Apply updates
    const updatedSettings: UserSettings = {
      ...settings,
      profile: { ...settings.profile, ...updates.profile },
      notifications: {
        ...settings.notifications,
        ...updates.notifications,
        dailyCheckIn: { ...settings.notifications.dailyCheckIn, ...updates.notifications?.dailyCheckIn },
        weeklyReport: { ...settings.notifications.weeklyReport, ...updates.notifications?.weeklyReport },
        communityCircles: { ...settings.notifications.communityCircles, ...updates.notifications?.communityCircles },
      },
      personalization: { ...settings.personalization, ...updates.personalization },
      tracking: { ...settings.tracking, ...updates.tracking },
      dataManagement: { ...settings.dataManagement, ...updates.dataManagement },
      timestamps: {
        ...settings.timestamps,
        updatedAt: new Date().toISOString(),
      },
    }

    saveUserSettingsToStorage(updatedSettings)

    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error("Error updating user settings:", error)
    return NextResponse.json({ error: "Failed to update user settings" }, { status: 500 })
  }
}
