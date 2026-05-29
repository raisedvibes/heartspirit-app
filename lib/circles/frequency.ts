export type CircleFrequency = "Weekly" | "Monthly"

export function normalizeCircleFrequencyInput(value: unknown): CircleFrequency | null {
  if (value === null || value === undefined || value === "") return null
  if (value === "Weekly" || value === "Monthly") return value
  return null
}

export function formatCircleDateAndFrequency(
  startsAt: string | null | undefined,
  frequency: string | null | undefined,
  formatDate: (iso: string | null | undefined) => string
): string {
  return [formatDate(startsAt), frequency?.trim()].filter(Boolean).join(" • ")
}
