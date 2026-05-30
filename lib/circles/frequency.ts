export type CircleFrequency = "Weekly" | "Monthly"

export function normalizeCircleFrequencyInput(value: unknown): CircleFrequency | null {
  if (value === null || value === undefined) return null
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (trimmed === "" || trimmed.toLowerCase() === "none") return null
    if (trimmed === "Weekly" || trimmed === "Monthly") return trimmed
  }
  return null
}

export function formatCircleDateAndFrequency(
  startsAt: string | null | undefined,
  frequency: string | null | undefined,
  formatDate: (iso: string | null | undefined) => string
): string {
  return [formatDate(startsAt), frequency?.trim()].filter(Boolean).join(" • ")
}
