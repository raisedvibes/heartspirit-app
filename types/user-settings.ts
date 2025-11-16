export interface UserSettings {
  id: string
  userId: string
  profile: {
    name: string
    email: string
    profilePicUrl?: string
  }
  notifications: {
    dailyCheckIn: {
      enabled: boolean
      time: string // Format: "HH:MM" (24-hour)
    }
    weeklyReport: {
      enabled: boolean
    }
    communityCircles: {
      enabled: boolean
    }
  }
  personalization: {
    theme: "light" | "dark" | "system"
    focusWord: string
  }
  tracking: {
    ritualHistoryEnabled: boolean
    lastCheckInDate?: string // ISO date string
    streakCount: number
  }
  dataManagement: {
    allowExport: boolean
    allowClear: boolean
  }
  support: {
    contactSupportUrl: string
    privacyPolicyUrl: string
    termsOfUseUrl: string
  }
  timestamps: {
    createdAt: string // ISO date string
    updatedAt: string // ISO date string
  }
}

export interface UserSettingsUpdate {
  profile?: Partial<UserSettings["profile"]>
  notifications?: Partial<UserSettings["notifications"]>
  personalization?: Partial<UserSettings["personalization"]>
  tracking?: Partial<UserSettings["tracking"]>
  dataManagement?: Partial<UserSettings["dataManagement"]>
}
