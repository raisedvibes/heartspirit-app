export type EnergyLevel = "Low" | "Moderate" | "Good" | "High"

export interface Practice {
  id: string
  title: string
  description: string
  category: "Breathwork" | "Meditation" | "Journaling" | "Energy Ritual"
  media: {
    timer?: boolean
    audio?: string
    video?: string
    background?: string
    image?: string
  }
  duration: number            // total minutes
  steps: string[]             // ✅ strings only
  tags: string[]
  recommendations?: {
    pairs: Array<{
      energy: EnergyLevel
      feelingtone: string
      priority: number
    }>
  }
}
