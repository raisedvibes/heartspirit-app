// apps/mobile/components/ui/glass.ts
export const GLASS = {
    bgDark: "rgba(10,20,16,0.74)",     // subtle darker bump for legibility
    borderDark: "rgba(255,255,255,0.16)",
    bgLight: "rgba(255,255,255,0.10)",
    borderLight: "rgba(255,255,255,0.18)",
  } as const

/** Outlined CTA used on Home dashboard cards (Circles, Rituals, promo). */
export const GLASS_OUTLINE_CTA = {
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  buttonText: { fontSize: 12, opacity: 0.9 },
} as const