import { type NextRequest, NextResponse } from "next/server"
import { getUserSettingsFromStorage } from "@/lib/user-settings"

// GET /api/user-settings/export - Export user data
export async function GET(request: NextRequest) {
  try {
    const userId = "default_user" // In a real app, get from auth
    const settings = getUserSettingsFromStorage(userId)

    if (!settings) {
      return NextResponse.json({ error: "No user settings found" }, { status: 404 })
    }

    // Create export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      userSettings: settings,
      // Add other user data here (rituals, check-ins, etc.)
    }

    return NextResponse.json(exportData, {
      headers: {
        "Content-Disposition": 'attachment; filename="heartspirit-data-export.json"',
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error exporting user data:", error)
    return NextResponse.json({ error: "Failed to export user data" }, { status: 500 })
  }
}
