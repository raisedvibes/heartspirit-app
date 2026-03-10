type RecommendationAssignment = {
  feelingtone: string
  sequence_index: string
}

type Draft = {
  title: string
  description: string
  category: string
  duration: string
  media_url: string
  slug: string
  tags: string
  short_summary: string
  audio_url: string
  cover_image: string
  media_type: string
  thumbnail_url: string
  instruction_bullets: string
  mantra: string
  timer_minutes: string
  has_chime: boolean
  recommendation_assignments: RecommendationAssignment[]
}

const emptyDraft: Draft = {
  title: "",
  description: "",
  category: "",
  duration: "",
  media_url: "",
  slug: "",
  tags: "",
  short_summary: "",
  audio_url: "",
  cover_image: "",
  media_type: "",
  thumbnail_url: "",
  instruction_bullets: "",
  mantra: "",
  timer_minutes: "",
  has_chime: true,
  recommendation_assignments: [],
}