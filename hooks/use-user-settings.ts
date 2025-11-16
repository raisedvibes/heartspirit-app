"use client"

import { useState, useEffect } from "react"
import type { UserSettings, UserSettingsUpdate } from "@/types/user-settings"

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user settings
  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/user-settings")
      if (!response.ok) {
        throw new Error("Failed to fetch settings")
      }

      const data = await response.json()
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  // Update user settings
  const updateSettings = async (updates: UserSettingsUpdate) => {
    try {
      setError(null)

      const response = await fetch("/api/user-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error("Failed to update settings")
      }

      const updatedSettings = await response.json()
      setSettings(updatedSettings)

      return updatedSettings
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      throw err
    }
  }

  // Export user data
  const exportData = async () => {
    try {
      const response = await fetch("/api/user-settings/export")
      if (!response.ok) {
        throw new Error("Failed to export data")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "heartspirit-data-export.json"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      throw err
    }
  }

  // Clear user data
  const clearData = async () => {
    try {
      // In a real app, this would call an API endpoint to clear data
      if (typeof window !== "undefined") {
        localStorage.removeItem("userSettings_default_user")
      }
      await fetchSettings() // Refresh to get default settings
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      throw err
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    loading,
    error,
    updateSettings,
    exportData,
    clearData,
    refetch: fetchSettings,
  }
}
