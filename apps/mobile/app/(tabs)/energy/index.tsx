import { useEffect, useMemo, useState } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
} from "react-native"
import { Image } from "expo-image"
import Animated from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { router } from "expo-router"
import ScreenContent, { getTabScrollContentBottomPadding } from "@/components/layout/ScreenContent"
import { useCollapsibleTabHeader } from "@/hooks/useCollapsibleTabHeader"
import { EnergyCheck } from "@/components/dashboard/EnergyCheck"
import { ThemedText } from "@/components/themed-text"
import BottomFade from "@/components/ui/BottomFade"
import { GLASS } from "@/components/ui/glass"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { getOfflineCacheData, OfflineCacheKeys, setOfflineCache } from "@/lib/offlineCache"

type SeasonKey = "spring" | "summer" | "autumn" | "winter"

type TodaySlotSlug =
  | "open_the_portal"
  | "hold_the_frequency"
  | "return_to_source"

type SeasonalSlotSlug =
  | "seasonal_1"
  | "seasonal_2"
  | "seasonal_3"
  | "seasonal_4"

type CustomSlotSlug = "custom_1" | "custom_2" | "custom_3" | "custom_4"

type PracticeSummary = {
  id: string
  title: string
  short_summary: string | null
  duration: number | null
  timer_minutes: number | null
  cover_image: string | null
  thumbnail_url: string | null
}

type PlacementRow = {
  slot_slug: TodaySlotSlug | SeasonalSlotSlug | CustomSlotSlug
  sort_order: number
  practice: PracticeSummary | null
}

type CustomSection = {
  title: string
  subtitle: string | null
  is_active: boolean
}

const { width: SCREEN_WIDTH } = Dimensions.get("window")

// Calm-style featured tiles: wider, landscape-featured (one dominant card visible, next peeking)
const RAIL_CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.84, 332)
const RAIL_CARD_HEIGHT = Math.round(RAIL_CARD_WIDTH * 0.72)

const SHELL_PADDING = 10
const INNER_WIDTH = RAIL_CARD_WIDTH - SHELL_PADDING * 2
const INNER_HEIGHT = RAIL_CARD_HEIGHT - SHELL_PADDING * 2

const PEEK_PADDING = 20
const RAIL_CARD_GAP = 14
const RAIL_CARD_SNAP_INTERVAL = RAIL_CARD_WIDTH + RAIL_CARD_GAP

const TODAY_SLOT_LABELS: Record<TodaySlotSlug, string> = {
  open_the_portal: "Open the Portal",
  hold_the_frequency: "Hold the Frequency",
  return_to_source: "Return to Source",
}

const TODAY_SLOT_PERIODS: Record<TodaySlotSlug, string> = {
  open_the_portal: "Morning",
  hold_the_frequency: "Midday",
  return_to_source: "Evening",
}

const TODAY_SLOT_ORDER: Record<TodaySlotSlug, number> = {
  open_the_portal: 0,
  hold_the_frequency: 1,
  return_to_source: 2,
}

const SEASONAL_SLOT_ORDER: Record<SeasonalSlotSlug, number> = {
  seasonal_1: 0,
  seasonal_2: 1,
  seasonal_3: 2,
  seasonal_4: 3,
}

const CUSTOM_SLOT_ORDER: Record<CustomSlotSlug, number> = {
  custom_1: 0,
  custom_2: 1,
  custom_3: 2,
  custom_4: 3,
}

/** Custom placements only: unwrap PostgREST embed if returned as an array. */
function unwrapCustomPractice(raw: unknown): PracticeSummary | null {
  if (raw == null) return null
  if (Array.isArray(raw)) {
    const first = raw.find((x) => x && typeof x === "object" && x !== null && "id" in x) as
      | PracticeSummary
      | undefined
    return first ?? null
  }
  if (typeof raw === "object" && raw !== null && "id" in raw) {
    return raw as PracticeSummary
  }
  return null
}

function toLocalStartOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function getFallbackSeasonBoundaries(year: number) {
  return {
    spring: new Date(year, 2, 20, 0, 0, 0, 0),
    summer: new Date(year, 5, 20, 0, 0, 0, 0),
    autumn: new Date(year, 8, 22, 0, 0, 0, 0),
    winter: new Date(year, 11, 21, 0, 0, 0, 0),
  }
}

function computeSeason(
  today: Date,
  boundaries: { spring: Date; summer: Date; autumn: Date; winter: Date }
): SeasonKey {
  const t = toLocalStartOfDay(today)
  if (t >= boundaries.winter || t < boundaries.spring) return "winter"
  if (t >= boundaries.spring && t < boundaries.summer) return "spring"
  if (t >= boundaries.summer && t < boundaries.autumn) return "summer"
  return "autumn"
}

function formatSeasonLabel(season: SeasonKey) {
  switch (season) {
    case "spring":
      return "Spring"
    case "summer":
      return "Summer"
    case "autumn":
      return "Autumn"
    case "winter":
      return "Winter"
    default:
      return "Seasonal"
  }
}

function getCurrentTodaySlot(date = new Date()): TodaySlotSlug {
  const hour = date.getHours()

  if (hour >= 4 && hour < 11) return "open_the_portal"
  if (hour >= 11 && hour < 17) return "hold_the_frequency"
  return "return_to_source"
}

function rotateTodaySlots(activeSlot: TodaySlotSlug): TodaySlotSlug[] {
  const slots: TodaySlotSlug[] = [
    "open_the_portal",
    "hold_the_frequency",
    "return_to_source",
  ]
  const startIndex = slots.indexOf(activeSlot)
  if (startIndex === -1) return slots
  return [...slots.slice(startIndex), ...slots.slice(0, startIndex)]
}

function getImageSource(practice?: PracticeSummary | null) {
  const remoteUrl = practice?.thumbnail_url?.trim() || practice?.cover_image?.trim()

  if (remoteUrl && remoteUrl.startsWith("http")) {
    return { uri: remoteUrl }
  }

  return require("@/assets/images/fern_background.png")
}

function RailCardFooterTitle({ title }: { title: string }) {
  return (
    <View style={styles.railCardBottom}>
      <ThemedText
        type="defaultSemiBold"
        style={styles.railCardTitle}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {title}
      </ThemedText>
    </View>
  )
}

function TodayPracticeCard({
  slotSlug,
  practice,
  isActive,
  onPress,
}: {
  slotSlug: TodaySlotSlug
  practice?: PracticeSummary | null
  isActive: boolean
  onPress?: () => void
}) {
  const [useLocalFallback, setUseLocalFallback] = useState(false)

  const source = useMemo(() => {
    if (useLocalFallback) return require("@/assets/images/fern_background.png")
    return getImageSource(practice)
  }, [practice, useLocalFallback])

  return (
    <View style={styles.cardSlot}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.shellCardWrap,
          isActive && styles.shellCardWrapActive,
          pressed && styles.shellCardWrapPressed,
        ]}
      >
        <View style={styles.shellCardInner}>
          <View style={[styles.railCardBg, styles.railCardBgBottomAligned]}>
            <Image
              source={source}
              style={styles.railCardImageFill}
              contentFit="cover"
              cachePolicy="disk"
              transition={250}
              placeholder={require("@/assets/images/fern_background.png")}
              onError={() => {
                console.log("[energy] today card image failed, using fallback")
                setUseLocalFallback(true)
              }}
            />
            <View style={styles.railCardOverlay} />

            <View style={styles.railCardTop}>
              <ThemedText style={styles.railCardPeriod}>
                {TODAY_SLOT_PERIODS[slotSlug]}
              </ThemedText>
            </View>

            <RailCardFooterTitle title={TODAY_SLOT_LABELS[slotSlug]} />
          </View>
        </View>
      </Pressable>
    </View>
  )
}

function SeasonalPracticeCard({
  title,
  practice,
  onPress,
}: {
  title: string
  practice?: PracticeSummary | null
  onPress?: () => void
}) {
  const [useLocalFallback, setUseLocalFallback] = useState(false)

  const source = useMemo(() => {
    if (useLocalFallback) return require("@/assets/images/fern_background.png")
    return getImageSource(practice)
  }, [practice, useLocalFallback])

  return (
    <View style={styles.cardSlot}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.shellCardWrap,
          pressed && styles.shellCardWrapPressed,
        ]}
      >
        <View style={styles.shellCardInner}>
          <View style={[styles.railCardBg, styles.railCardBgBottomAligned]}>
            <Image
              source={source}
              style={styles.railCardImageFill}
              contentFit="cover"
              cachePolicy="disk"
              transition={250}
              placeholder={require("@/assets/images/fern_background.png")}
              onError={() => {
                console.log("[energy] seasonal card image failed, using fallback")
                setUseLocalFallback(true)
              }}
            />
            <View style={styles.railCardOverlay} />

            <RailCardFooterTitle title={title} />
          </View>
        </View>
      </Pressable>
    </View>
  )
}

export default function EnergyCheckScreen() {
  const insets = useSafeAreaInsets()
  const { animatedScreenOuterStyle, scrollHandler } = useCollapsibleTabHeader("energy")
  const [userName] = useState<string | undefined>(undefined)
  const [todayPlacements, setTodayPlacements] = useState<PlacementRow[]>([])
  const [seasonalPlacements, setSeasonalPlacements] = useState<PlacementRow[]>([])
  const [customPlacements, setCustomPlacements] = useState<PlacementRow[]>([])
  const [customSection, setCustomSection] = useState<CustomSection>({
    title: "",
    subtitle: null,
    is_active: false,
  })
  const [loadingPlacements, setLoadingPlacements] = useState(true)
  const [usingCachedPlacements, setUsingCachedPlacements] = useState(false)

  const season = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const boundaries = getFallbackSeasonBoundaries(year)
    return computeSeason(now, boundaries)
  }, [])

  const currentTodaySlot = useMemo(() => getCurrentTodaySlot(), [])
  const orderedTodaySlots = useMemo(
    () => rotateTodaySlots(currentTodaySlot),
    [currentTodaySlot]
  )

  const orderedTodayPlacements = useMemo(() => {
    const placementMap = new Map(
      todayPlacements.map((item) => [item.slot_slug as TodaySlotSlug, item])
    )

    return orderedTodaySlots
      .map((slot) => placementMap.get(slot))
      .filter(Boolean) as PlacementRow[]
  }, [todayPlacements, orderedTodaySlots])

  useEffect(() => {
    let isMounted = true

    async function loadPlacements() {
      const todayCacheKey = OfflineCacheKeys.energy.todayPlacements
      const seasonalCacheKey = OfflineCacheKeys.energy.seasonalPlacements(season)
      const customCacheKey = OfflineCacheKeys.energy.seasonalPlacements("custom")
      const supabase = getSupabaseClient()
      if (!supabase) {
        const [cachedToday, cachedSeasonal, cachedCustom] = await Promise.all([
          getOfflineCacheData<PlacementRow[]>(todayCacheKey),
          getOfflineCacheData<PlacementRow[]>(seasonalCacheKey),
          getOfflineCacheData<PlacementRow[]>(customCacheKey),
        ])
        setTodayPlacements(cachedToday ?? [])
        setSeasonalPlacements(cachedSeasonal ?? [])
        setCustomPlacements(cachedCustom ?? [])
        setUsingCachedPlacements(Boolean(cachedToday || cachedSeasonal || cachedCustom))
        if (isMounted) setLoadingPlacements(false)
        return
      }

      setLoadingPlacements(true)

      const [
        { data: todayData, error: todayError },
        { data: seasonalData, error: seasonalError },
        { data: customData, error: customError },
        { data: customSectionData, error: customSectionError },
      ] =
        await Promise.all([
          supabase
            .from("practice_placements")
            .select(`
              slot_slug,
              sort_order,
              practice:practices (
                id,
                title,
                short_summary,
                duration,
                timer_minutes,
                cover_image,
                thumbnail_url
              )
            `)
            .eq("placement_group", "today")
            .eq("is_active", true),

          supabase
            .from("practice_placements")
            .select(`
              slot_slug,
              sort_order,
              practice:practices (
                id,
                title,
                short_summary,
                duration,
                timer_minutes,
                cover_image,
                thumbnail_url
              )
            `)
            .eq("placement_group", "season")
            .eq("season_key", season)
            .eq("is_active", true),

          supabase
            .from("practice_placements")
            .select(`
              slot_slug,
              sort_order,
              practice:practices (
                id,
                title,
                short_summary,
                duration,
                timer_minutes,
                cover_image,
                thumbnail_url
              )
            `)
            .eq("placement_group", "custom")
            .is("season_key", null)
            .eq("is_active", true),

          supabase
            .from("energy_section_settings")
            .select("section_key, title, subtitle, is_active")
            .eq("section_key", "custom")
            .limit(1)
            .maybeSingle(),
        ])

      if (!isMounted) return

      if (todayError) {
        console.log("[energy] failed to load today placements:", todayError.message)
      }

      if (seasonalError) {
        console.log("[energy] failed to load seasonal placements:", seasonalError.message)
      }
      if (customError) {
        console.log("[energy] failed to load custom placements:", customError.message)
      }
      if (customSectionError) {
        console.log("[energy] failed to load custom section:", customSectionError.message)
      }

      const normalizeTodayRows = (rows: PlacementRow[]) =>
        rows
          .filter((row) => row.practice?.id)
          .sort((a, b) => {
            const aOrder = TODAY_SLOT_ORDER[a.slot_slug as TodaySlotSlug] ?? 999
            const bOrder = TODAY_SLOT_ORDER[b.slot_slug as TodaySlotSlug] ?? 999
            return aOrder - bOrder
          })

      const normalizeSeasonalRows = (rows: PlacementRow[]) =>
        rows
          .filter((row) => row.practice?.id)
          .sort((a, b) => {
            const aOrder = SEASONAL_SLOT_ORDER[a.slot_slug as SeasonalSlotSlug] ?? 999
            const bOrder = SEASONAL_SLOT_ORDER[b.slot_slug as SeasonalSlotSlug] ?? 999
            return aOrder - bOrder
          })

      const normalizeCustomRows = (rows: unknown[]) =>
        rows
          .map((raw) => {
            const row = raw as Record<string, unknown>
            return {
              slot_slug: row.slot_slug as CustomSlotSlug,
              sort_order: Number(row.sort_order ?? 0),
              practice: unwrapCustomPractice(row.practice),
            } as PlacementRow
          })
          .filter((row) => Boolean(row.practice?.id))
          .sort((a, b) => {
            const aOrder = CUSTOM_SLOT_ORDER[a.slot_slug as CustomSlotSlug] ?? 999
            const bOrder = CUSTOM_SLOT_ORDER[b.slot_slug as CustomSlotSlug] ?? 999
            return aOrder - bOrder
          })

      let usedCache = false
      let normalizedToday = normalizeTodayRows((todayData as PlacementRow[] | null) ?? [])
      let normalizedSeasonal = normalizeSeasonalRows((seasonalData as PlacementRow[] | null) ?? [])
      let normalizedCustom = normalizeCustomRows((customData as unknown[] | null) ?? [])

      if (todayError) {
        const cachedToday = await getOfflineCacheData<PlacementRow[]>(todayCacheKey)
        if (cachedToday) {
          normalizedToday = normalizeTodayRows(cachedToday)
          usedCache = true
        }
      }

      if (seasonalError) {
        const cachedSeasonal = await getOfflineCacheData<PlacementRow[]>(seasonalCacheKey)
        if (cachedSeasonal) {
          normalizedSeasonal = normalizeSeasonalRows(cachedSeasonal)
          usedCache = true
        }
      }
      if (customError) {
        const cachedCustom = await getOfflineCacheData<PlacementRow[]>(customCacheKey)
        if (cachedCustom) {
          normalizedCustom = normalizeCustomRows(cachedCustom)
          usedCache = true
        }
      }

      setTodayPlacements(normalizedToday)
      setSeasonalPlacements(normalizedSeasonal)
      setCustomPlacements(normalizedCustom)
      const sectionTitle =
        typeof customSectionData?.title === "string" ? customSectionData.title.trim() : ""
      setCustomSection({
        title: sectionTitle,
        subtitle: customSectionData?.subtitle ?? null,
        is_active: customSectionData?.is_active === true,
      })
      setUsingCachedPlacements(usedCache)
      setLoadingPlacements(false)

      if (!todayError) {
        void setOfflineCache(todayCacheKey, normalizedToday)
      }
      if (!seasonalError) {
        void setOfflineCache(seasonalCacheKey, normalizedSeasonal)
      }
      if (!customError) {
        void setOfflineCache(customCacheKey, normalizedCustom)
      }
    }

    loadPlacements()

    return () => {
      isMounted = false
    }
  }, [season])

  const shouldRenderCustomSection = useMemo(() => {
    const titleOk = (customSection.title?.trim().length ?? 0) > 0
    return (
      customSection.is_active === true &&
      titleOk &&
      customPlacements.length > 0
    )
  }, [customPlacements.length, customSection.is_active, customSection.title])

  return (
    <View style={styles.root}>
      <ScreenContent
        animatedOuterStyle={animatedScreenOuterStyle}
        bottomPaddingOverride={0}
      >
        <Animated.ScrollView
          style={styles.mainScroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: getTabScrollContentBottomPadding(insets), flexGrow: 1 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <View style={styles.headerBlock}>
            <ThemedText type="title" style={styles.title}>
              Energy
            </ThemedText>
            <ThemedText type="muted" style={styles.subtitle}>
              check in with yourself
            </ThemedText>
            {usingCachedPlacements ? (
              <ThemedText type="muted" style={styles.cachedNotice}>
                Offline mode - showing saved energy practices.
              </ThemedText>
            ) : null}
          </View>

          <EnergyCheck userName={userName} />

          <View style={[styles.sectionBlock, styles.todaySectionBlock]}>
            <ThemedText style={styles.sectionTitle}>Today</ThemedText>
            <ScrollView
              horizontal
              nestedScrollEnabled={Platform.OS === "android"}
              snapToInterval={RAIL_CARD_SNAP_INTERVAL}
              snapToAlignment="start"
              decelerationRate="fast"
              disableIntervalMomentum
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRail}
              style={styles.railScroll}
            >
              {orderedTodayPlacements.length > 0 ? (
                orderedTodayPlacements.map((item) => (
                  <TodayPracticeCard
                    key={item.slot_slug}
                    slotSlug={item.slot_slug as TodaySlotSlug}
                    practice={item.practice}
                    isActive={item.slot_slug === currentTodaySlot}
                    onPress={() => {
                      if (!item.practice?.id) return
                      router.push(`/practice/${item.practice.id}`)
                    }}
                  />
                ))
              ) : (
                <TodayPracticeCard
                  slotSlug={currentTodaySlot}
                  isActive
                  onPress={undefined}
                />
              )}
            </ScrollView>
          </View>

          <View style={styles.sectionBlock}>
            <ThemedText style={styles.sectionTitle}>
              {formatSeasonLabel(season)}
            </ThemedText>
            <ScrollView
              horizontal
              nestedScrollEnabled={Platform.OS === "android"}
              snapToInterval={RAIL_CARD_SNAP_INTERVAL}
              snapToAlignment="start"
              decelerationRate="fast"
              disableIntervalMomentum
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRail}
              style={styles.railScroll}
            >
              {seasonalPlacements.length > 0 ? (
                seasonalPlacements.map((item) => (
                  <SeasonalPracticeCard
                    key={item.slot_slug}
                    title={item.practice?.title ?? "Untitled Practice"}
                    practice={item.practice}
                    onPress={() => {
                      if (!item.practice?.id) return
                      router.push(`/practice/${item.practice.id}`)
                    }}
                  />
                ))
              ) : (
                <SeasonalPracticeCard
                  title={loadingPlacements ? "Loading..." : "No seasonal practices assigned yet"}
                />
              )}
            </ScrollView>
          </View>

          {shouldRenderCustomSection ? (
            <View style={styles.sectionBlock}>
              <ThemedText style={styles.sectionTitle}>{customSection.title}</ThemedText>
              {customSection.subtitle ? (
                <ThemedText type="muted" style={styles.customSubtitle}>
                  {customSection.subtitle}
                </ThemedText>
              ) : null}
              <ScrollView
                horizontal
                nestedScrollEnabled={Platform.OS === "android"}
                snapToInterval={RAIL_CARD_SNAP_INTERVAL}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalRail}
                style={styles.railScroll}
              >
                {customPlacements.map((item) => (
                  <SeasonalPracticeCard
                    key={item.slot_slug}
                    title={item.practice?.title ?? "Untitled Practice"}
                    practice={item.practice}
                    onPress={() => {
                      if (!item.practice?.id) return
                      router.push(`/practice/${item.practice.id}`)
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </Animated.ScrollView>
      </ScreenContent>
      <BottomFade />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  mainScroll: {
    flex: 1,
  },

  content: {
    gap: 20,
  },

  headerBlock: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },

  title: {
    fontSize: 24,
    fontWeight: "600",
  },

  subtitle: {
    marginTop: 6,
  },
  cachedNotice: {
    marginTop: 6,
    fontSize: 11,
    opacity: 0.72,
  },

  sectionBlock: {
    gap: 12,
  },
  todaySectionBlock: {
    marginTop: 24,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: "#FFFFFF",
    marginBottom: 4,
    paddingHorizontal: 16,
    textShadowColor: "rgba(0,0,0,0.82)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  customSubtitle: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: -4,
    paddingHorizontal: 16,
  },

  railScroll: {
    marginHorizontal: -16,
    height: RAIL_CARD_HEIGHT + 32,
  },

  horizontalRail: {
    flexDirection: "row",
    paddingLeft: 16,
    paddingRight: 16 + PEEK_PADDING,
    paddingVertical: 8,
    gap: RAIL_CARD_GAP,
    alignItems: "flex-start",
  },

  cardSlot: {
    width: RAIL_CARD_WIDTH,
    height: RAIL_CARD_HEIGHT,
    flexShrink: 0,
    flexGrow: 0,
  },

  shellCardWrap: {
    width: RAIL_CARD_WIDTH,
    height: RAIL_CARD_HEIGHT,
    flexShrink: 0,
    flexGrow: 0,
    borderRadius: 24,
    backgroundColor: GLASS.bgDark,
    borderWidth: 1.5,
    borderColor: GLASS.borderDark,
    padding: SHELL_PADDING,
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  shellCardWrapActive: {
    borderColor: "rgba(255,255,255,0.38)",
    shadowOpacity: 0.36,
    shadowRadius: 20,
    elevation: 10,
  },

  shellCardWrapPressed: {
    opacity: 0.96,
  },

  shellCardInner: {
    width: INNER_WIDTH,
    height: INNER_HEIGHT,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.12)",
  },

  railCardBg: {
    width: INNER_WIDTH,
    height: INNER_HEIGHT,
    justifyContent: "space-between",
    backgroundColor: "rgba(7,14,10,0.32)",
  },

  railCardBgBottomAligned: {
    justifyContent: "flex-end",
  },

  railCardImageFill: {
    ...StyleSheet.absoluteFillObject,
  },

  railCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  railCardTop: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: "flex-start",
  },

  railCardPeriod: {
    color: "rgba(255,255,255,0.96)",
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  railCardBottom: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  railCardTitle: {
    fontSize: 17,
    lineHeight: 22,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
})
