import { useState, useRef, useCallback } from "react"
import { useFocusEffect } from "expo-router"
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
  useWindowDimensions,
  type FlatList as RNFlatList,
} from "react-native"
import { BlurView } from "expo-blur"
import Animated from "react-native-reanimated"
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ScreenContent, {
  getTabScrollContentBottomPadding,
  getTabScrollContentTopPadding,
} from "@/components/layout/ScreenContent"
import { useCollapsibleTabHeader } from "@/hooks/useCollapsibleTabHeader"
import { ANDROID_SCROLL_PRESS_DELAY } from "@/lib/androidScrollPress"
import BottomFade from "@/components/ui/BottomFade"
import TranslucentCard from "../../components/ui/TranslucentCard"
import { GLASS } from "@/components/ui/glass"
import { ThemedText } from "@/components/themed-text"
import { NotificationPermissionModal } from "@/components/notifications/NotificationPermissionModal"
import {
  enableNotificationsFromPrompt,
  isNotificationPermissionGranted,
  STAY_IN_RHYTHM_PROMPT,
} from "@/lib/notificationPermissionPrompt"
import {
  useRitualsStore,
  todayISO,
  localISODate,
  type Ritual,
  type Mark,
} from "../../lib/ritualsStore"
import { computeStreak } from "../../lib/ritualStats"
import {
  cancelScheduledNotification,
  hasNotifPermissions,
  reconcileRitualReminderNotifications,
  scheduleDailyReminder,
} from "../../lib/ritualNotifications"

function startOfWeekMonday(d: Date): Date {
  const out = new Date(d)
  const mondayOffset = out.getDay() === 0 ? -6 : 1 - out.getDay()
  out.setDate(out.getDate() + mondayOffset)
  return out
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}

function formatWeekRange(days: Date[]): string {
  const start = days[0]
  const end = days[6]
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  if (start.getMonth() === end.getMonth()) {
    return `${m[start.getMonth()]} ${start.getDate()}–${end.getDate()}`
  }
  return `${m[start.getMonth()]} ${start.getDate()}–${m[end.getMonth()]} ${end.getDate()}`
}

function hhmm(d: Date) {
  const h = String(d.getHours()).padStart(2, "0")
  const m = String(d.getMinutes()).padStart(2, "0")
  return `${h}:${m}`
}
function displayTime(d: Date) {
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"]

const RITUAL_REMINDER_SCHEDULE_FAILED_MESSAGE =
  "Your ritual was saved, but the daily reminder could not be scheduled. Check notification settings and try editing the ritual."

async function tryScheduleRitualDailyReminder(params: {
  ritualId: string
  ritualName: string
  reminderTime: Date
}): Promise<{ notificationId?: string; scheduleFailed: boolean }> {
  const { ritualId, ritualName, reminderTime } = params
  const timeValid = !Number.isNaN(reminderTime.getTime())

  console.log("[ritual save] tryScheduleRitualDailyReminder", {
    ritualId,
    ritualName,
    reminderTime: timeValid ? reminderTime.toISOString() : "invalid",
    hour: timeValid ? reminderTime.getHours() : null,
    minute: timeValid ? reminderTime.getMinutes() : null,
    timeValid,
  })

  const permitted = await hasNotifPermissions()
  console.log("[ritual save] hasNotifPermissions", { permitted })

  if (!permitted) {
    console.warn("[ritual save] reminder skipped — permission not granted")
    return { scheduleFailed: false }
  }

  if (!timeValid) {
    console.error("[ritual save] reminder skipped — invalid reminderTime")
    return { scheduleFailed: true }
  }

  try {
    console.log("[ritual save] before scheduleDailyReminder")
    const notificationId = await scheduleDailyReminder(
      `Ritual: ${ritualName}`,
      "",
      reminderTime,
      { type: "ritual_reminder", ritualId }
    )
    console.log("[ritual save] after scheduleDailyReminder", { notificationId })
    return { notificationId, scheduleFailed: false }
  } catch (error) {
    console.error("[ritual save] scheduleDailyReminder error", error)
    return { scheduleFailed: true }
  }
}

type RitualsListRow =
  | { _type: "headerTitle"; id: string }
  | { _type: "headerWeek"; id: string }
  | { _type: "empty"; id: string }
  | Ritual

export default function RitualsScreen() {
  const insets = useSafeAreaInsets()
  const { width: windowWidth } = useWindowDimensions()
  const deleteConfirmNarrowLayout = windowWidth < 360
  const { scrollHandler } = useCollapsibleTabHeader("rituals")
  const rituals = useRitualsStore((s) => s.rituals)
  const hasHydrated = useRitualsStore((s) => s.hasHydrated)
  const upsert = useRitualsStore((s) => s.upsert)
  const remove = useRitualsStore((s) => s.remove)
  const setMark = useRitualsStore((s) => s.setMark)

  const [weekAnchor, setWeekAnchor] = useState<Date>(() => new Date())
  const [selectedDayISO, setSelectedDayISO] = useState<string>(() => todayISO())

  useFocusEffect(
    useCallback(() => {
      setWeekAnchor(new Date())
      setSelectedDayISO(todayISO())
      return () => {}
    }, [])
  )

  const weekStart = startOfWeekMonday(weekAnchor)
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(weekStart, i))
  const todayISOStr = todayISO()
  const ritualsSorted = [...rituals].sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  )

  const headerTitleItem = { _type: "headerTitle" as const, id: "__header_title__" }
  const headerWeekItem = { _type: "headerWeek" as const, id: "__header_week__" }
  const emptyItem = { _type: "empty" as const, id: "__empty__" }
  const listData =
    hasHydrated && rituals.length === 0
      ? [headerTitleItem, headerWeekItem, emptyItem]
      : [headerTitleItem, headerWeekItem, ...ritualsSorted]
  const flatListRef = useRef<RNFlatList<RitualsListRow>>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [editRitualId, setEditRitualId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [intention, setIntention] = useState("")
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState<Date>(() => new Date())

  const openAndroidReminderTimePicker = useCallback(() => {
    DateTimePickerAndroid.open({
      value: reminderTime,
      mode: "time",
      display: "spinner",
      is24Hour: false,
      onChange: (event, date) => {
        if (event.type === "set" && date) {
          setReminderTime(date)
        }
      },
    })
  }, [reminderTime])

  const [markOpen, setMarkOpen] = useState(false)
  const [activeRitualId, setActiveRitualId] = useState<string | null>(null)
  const [activeISO, setActiveISO] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ritual | null>(null)
  const [showReminderNotifPrompt, setShowReminderNotifPrompt] = useState(false)
  const pendingFormSaveAfterNotifRef = useRef(false)

  const hideAddRitualModal = useCallback(() => {
    console.log("[ritual save] closing add modal")
    setShowAdd(false)
  }, [])

  const presentReminderNotifPrompt = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        console.log("[ritual save] showing notification prompt")
        setShowReminderNotifPrompt(true)
      }, 100)
    })
  }, [])

  const dismissReminderNotifPrompt = useCallback(() => {
    console.log("[ritual save] prompt dismissed")
    setShowReminderNotifPrompt(false)
    pendingFormSaveAfterNotifRef.current = false
  }, [])

  const closeAddRitualModal = useCallback(() => {
    console.log("[ritual save] closeAddRitualModal")
    setShowAdd(false)
    setShowReminderNotifPrompt(false)
    pendingFormSaveAfterNotifRef.current = false
    setEditRitualId(null)
    setName("")
    setIntention("")
    setReminderEnabled(false)
    setReminderTime(new Date())
  }, [])

  const openAddRitualModal = useCallback(() => {
    setEditRitualId(null)
    setName("")
    setIntention("")
    setReminderEnabled(false)
    setReminderTime(new Date())
    setShowReminderNotifPrompt(false)
    pendingFormSaveAfterNotifRef.current = false
    setShowAdd(true)
  }, [])

  const commitRitualSave = async () => {
    if (!name.trim()) return
    const now = new Date().toISOString()
    const trimmedName = name.trim()
    let reminderScheduleFailed = false

    if (editRitualId) {
      const existing = rituals.find((x) => x.id === editRitualId)
      if (!existing) return

      const oldReminder = existing.reminder
      const newReminder = reminderEnabled ? hhmm(reminderTime) : undefined

      let notificationId = existing.notificationId

      if (oldReminder !== newReminder) {
        if (notificationId) {
          await cancelScheduledNotification(notificationId)
          notificationId = undefined
        }
      }

      const ritualDraft: Ritual = {
        ...existing,
        name: trimmedName,
        intention: intention.trim() ? intention.trim() : undefined,
        tags: existing.tags ?? [],
        reminder: newReminder,
        notificationId,
        updatedAt: now,
      }

      console.log("[ritual save] before upsert (edit)", {
        id: ritualDraft.id,
        reminder: ritualDraft.reminder,
        notificationId: ritualDraft.notificationId,
      })
      upsert(ritualDraft)
      console.log("[ritual save] after upsert (edit)")

      if (oldReminder !== newReminder && newReminder) {
        const scheduleResult = await tryScheduleRitualDailyReminder({
          ritualId: existing.id,
          ritualName: trimmedName,
          reminderTime,
        })
        reminderScheduleFailed = scheduleResult.scheduleFailed
        if (scheduleResult.notificationId) {
          console.log("[ritual save] before upsert notificationId patch (edit)", {
            notificationId: scheduleResult.notificationId,
          })
          upsert({
            ...ritualDraft,
            notificationId: scheduleResult.notificationId,
          })
          console.log("[ritual save] after upsert notificationId patch (edit)")
        }
      }

      if (reminderScheduleFailed) {
        Alert.alert("Reminder not scheduled", RITUAL_REMINDER_SCHEDULE_FAILED_MESSAGE)
      }

      closeAddRitualModal()
      return
    }

    const id =
      globalThis.crypto && "randomUUID" in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : String(Date.now())

    const ritualDraft: Ritual = {
      id,
      name: trimmedName,
      intention: intention.trim() ? intention.trim() : undefined,
      tags: [],
      reminder: reminderEnabled ? hhmm(reminderTime) : undefined,
      notificationId: undefined,
      history: {},
      createdAt: now,
      updatedAt: now,
    }

    console.log("[ritual save] before upsert (create)", {
      id: ritualDraft.id,
      reminder: ritualDraft.reminder,
      reminderEnabled,
    })
    upsert(ritualDraft)
    console.log("[ritual save] after upsert (create)")

    if (reminderEnabled) {
      const scheduleResult = await tryScheduleRitualDailyReminder({
        ritualId: id,
        ritualName: trimmedName,
        reminderTime,
      })
      reminderScheduleFailed = scheduleResult.scheduleFailed
      if (scheduleResult.notificationId) {
        console.log("[ritual save] before upsert notificationId patch (create)", {
          notificationId: scheduleResult.notificationId,
        })
        upsert({
          ...ritualDraft,
          notificationId: scheduleResult.notificationId,
        })
        console.log("[ritual save] after upsert notificationId patch (create)")
      }
    }

    if (reminderScheduleFailed) {
      Alert.alert("Reminder not scheduled", RITUAL_REMINDER_SCHEDULE_FAILED_MESSAGE)
    }

    requestAnimationFrame(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }))
    closeAddRitualModal()
  }

  const addRitual = async () => {
    console.log("[ritual save] Add pressed", {
      name: name.trim(),
      reminderEnabled,
      reminderTime: reminderTime.toISOString(),
      reminderTimeValid: !Number.isNaN(reminderTime.getTime()),
    })

    if (!name.trim()) {
      Alert.alert("Name required", "Give your ritual a name before saving.")
      return
    }

    const permissionGranted = await isNotificationPermissionGranted()
    console.log("[ritual save] permission granted?", { permissionGranted })

    if (reminderEnabled && !permissionGranted) {
      pendingFormSaveAfterNotifRef.current = true
      hideAddRitualModal()
      presentReminderNotifPrompt()
      return
    }

    try {
      await commitRitualSave()
    } catch (error) {
      console.error("[ritual save] commitRitualSave error", error)
      Alert.alert("Couldn't save ritual", "Something went wrong. Please try again.")
    }
  }

  const handleAddNotifPromptPrimary = async () => {
    const pendingSave = pendingFormSaveAfterNotifRef.current
    pendingFormSaveAfterNotifRef.current = false
    dismissReminderNotifPrompt()
    await enableNotificationsFromPrompt()
    const granted = await isNotificationPermissionGranted()
    console.log("[ritual save] permission after enable prompt", { granted, pendingSave })
    if (pendingSave && granted) {
      try {
        await commitRitualSave()
      } catch (error) {
        console.error("[ritual save] commitRitualSave error (after enable prompt)", error)
        Alert.alert("Couldn't save ritual", "Something went wrong. Please try again.")
      }
      return
    }
    if (pendingSave && !granted) {
      setShowAdd(true)
    }
  }

  const handleAddNotifPromptSecondary = () => {
    dismissReminderNotifPrompt()
  }

  const handleAddNotifPromptClose = () => {
    dismissReminderNotifPrompt()
  }

  return (
    <View style={styles.root}>
      <ScreenContent edgeToEdgeScroll bottomPaddingOverride={0}>
        <View style={styles.inner}>
          <Animated.FlatList<RitualsListRow>
            ref={flatListRef}
            data={listData as RitualsListRow[]}
            keyExtractor={(item) => (item as { id: string }).id}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingTop: getTabScrollContentTopPadding(insets),
                paddingBottom: getTabScrollContentBottomPadding(insets),
              },
            ]}
            stickyHeaderIndices={[1]}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            renderItem={({ item }) => {
                if ("_type" in item && item._type === "headerTitle") {
                  return (
                    <View style={styles.headerBlock}>
                      <ThemedText type="title" style={styles.title}>
                        Rituals
                      </ThemedText>
                      <ThemedText type="muted" style={styles.subtitle}>
                        root in presence
                      </ThemedText>
                      <Pressable
                        style={styles.addRitualBtn}
                        onPress={openAddRitualModal}
                      >
                        <ThemedText type="defaultSemiBold" style={[styles.addButtonText, styles.addRitualText]}>
                          + add ritual
                        </ThemedText>
                      </Pressable>
                    </View>
                  )
                }
                if ("_type" in item && item._type === "headerWeek") {
                  return (
                    <TranslucentCard style={styles.weekHeaderCard}>
                      <View style={styles.weekNavRow}>
                        <Pressable
                          delayPressIn={ANDROID_SCROLL_PRESS_DELAY}
                          style={styles.weekNavColLeft}
                          onPress={() => setWeekAnchor(addDays(weekAnchor, -7))}
                        >
                          <ThemedText type="default" style={styles.weekNavBtnText}>back</ThemedText>
                        </Pressable>
                        <Pressable
                          delayPressIn={ANDROID_SCROLL_PRESS_DELAY}
                          style={styles.weekNavColCenter}
                          onPress={() => setWeekAnchor(new Date())}
                        >
                          <ThemedText type="default" style={styles.weekNavRangeText}>
                            {formatWeekRange(days)}
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          delayPressIn={ANDROID_SCROLL_PRESS_DELAY}
                          style={styles.weekNavColRight}
                          onPress={() => setWeekAnchor(addDays(weekAnchor, 7))}
                        >
                          <ThemedText type="default" style={styles.weekNavBtnText}>next</ThemedText>
                        </Pressable>
                      </View>
                      <View style={styles.weekHeader}>
                        {days.map((day, i) => {
                          const d = localISODate(day)
                          const isToday = d === todayISOStr
                          return (
                            <Pressable
                              key={d}
                              delayPressIn={ANDROID_SCROLL_PRESS_DELAY}
                              style={[
                                styles.weekCell,
                                isToday && styles.weekCellToday,
                                d === selectedDayISO && styles.weekCellSelected,
                              ]}
                              onPress={() => setSelectedDayISO(d)}
                            >
                              <ThemedText type="default" style={[styles.weekLabel, isToday && styles.weekLabelToday]}>
                                {DAY_LABELS[i]}
                              </ThemedText>
                              <ThemedText type="default" style={[styles.weekDate, isToday && styles.weekLabelToday]}>
                                {String(day.getDate())}
                              </ThemedText>
                            </Pressable>
                          )
                        })}
                      </View>
                    </TranslucentCard>
                  )
                }
                if ("_type" in item && item._type === "empty") {
                  return (
                    <TranslucentCard style={styles.emptyCard}>
                      <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                        No rituals yet — create a new ritual.
                      </ThemedText>
                      <ThemedText type="muted" style={styles.emptyBody}>
                        A ritual elevates a practice by intentionally connecting to heart.
                      </ThemedText>
                      <ThemedText type="muted" style={styles.emptyBody}>
                        What's a ritual that will support you right now?
                      </ThemedText>
                      <ThemedText type="muted" style={styles.examplesLabel}>
                        examples
                      </ThemedText>
                      <View style={styles.exampleList}>
                        {["morning breath", "evening reflection", "gratitude pause"].map(
                          (label) => (
                            <View key={label} style={styles.exampleRow}>
                              <ThemedText type="default" style={styles.exampleBullet}>•</ThemedText>
                              <ThemedText type="defaultSemiBold" style={styles.exampleLabel}>
                                {label}
                              </ThemedText>
                            </View>
                          )
                        )}
                      </View>
                      <Pressable
                        style={styles.emptyAddButton}
                        onPress={openAddRitualModal}
                      >
                        <ThemedText type="defaultSemiBold" style={styles.emptyAddButtonText}>
                          Add ritual
                        </ThemedText>
                      </Pressable>
                    </TranslucentCard>
                  )
                }
                const r = item as Ritual
                const streak = computeStreak(r.history || {}, todayISOStr)

                return (
                  <TranslucentCard style={styles.ritualRow}>
                    <View style={styles.ritualHeaderRow}>
                      <View style={styles.ritualTitleBlock}>
                        <ThemedText type="defaultSemiBold" style={styles.ritualName}>
                          {r.name}
                        </ThemedText>
                        {!!r.intention?.trim() && (
                          <ThemedText type="muted" style={styles.ritualIntention}>
                            {r.intention.trim()}
                          </ThemedText>
                        )}
                      </View>
                      <View style={styles.ritualHeaderRight}>
                        {streak >= 3 && (
                          <View style={styles.streakBadge}>
                            <ThemedText type="defaultSemiBold" style={styles.streakText}>
                              {streak}🔥
                            </ThemedText>
                          </View>
                        )}
                        <View style={styles.ritualActions}>
                          <Pressable
                            onPress={() => {
                              setShowReminderNotifPrompt(false)
                              pendingFormSaveAfterNotifRef.current = false
                              setEditRitualId(r.id)
                              setName(r.name)
                              setIntention(r.intention ?? "")
                              if (r.reminder) {
                                setReminderEnabled(true)
                                const [h, m] = r.reminder.split(":").map(Number)
                                const d = new Date()
                                d.setHours(h)
                                d.setMinutes(m)
                                setReminderTime(d)
                              } else {
                                setReminderEnabled(false)
                              }
                              setShowAdd(true)
                            }}
                          >
                            <ThemedText type="muted" style={styles.actionText}>
                              edit
                            </ThemedText>
                          </Pressable>
                          <Pressable onPress={() => setDeleteTarget(r)}>
                            <ThemedText type="muted" style={[styles.actionText, styles.deleteText]}>
                              delete
                            </ThemedText>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                    <View style={styles.dayRow}>
                      {days.map((day) => {
                        const isoDay = localISODate(day)
                        const isFuture = isoDay > todayISOStr
                        const status = r.history[isoDay] as Mark | undefined
                        const baseBox = {
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          borderWidth: 1,
                          alignItems: "center" as const,
                          justifyContent: "center" as const,
                          paddingTop: 2,
                        }
                        const boxStyle =
                          status === "yes"
                            ? { ...baseBox, backgroundColor: "rgba(100,200,120,0.25)", borderColor: "rgba(100,200,120,0.5)" }
                            : status === "no"
                              ? { ...baseBox, backgroundColor: "rgba(255,80,80,0.18)", borderColor: "rgba(255,80,80,0.35)" }
                              : status === "skip"
                                ? { ...baseBox, backgroundColor: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.25)" }
                                : { ...baseBox, borderColor: "rgba(255,255,255,0.18)" }
                        return (
                          <Pressable
                            key={isoDay}
                            style={[
                              boxStyle,
                              isoDay === todayISOStr && styles.dayBoxToday,
                              isFuture && styles.dayBoxFuture,
                            ]}
                            disabled={isFuture}
                            onPress={() => {
                              if (isFuture) return
                              setActiveRitualId(r.id)
                              setActiveISO(isoDay)
                              setMarkOpen(true)
                            }}
                          />
                        )
                      })}
                    </View>
                  </TranslucentCard>
                )
            }}
          />
        </View>
      </ScreenContent>
      <BottomFade />

      {showAdd ? (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={closeAddRitualModal}
      >
        <View style={styles.ritualFormModalRoot}>
          <BlurView
            intensity={Platform.OS === "ios" ? 62 : 50}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            accessibilityRole="button"
            style={styles.ritualFormModalDim}
            onPress={closeAddRitualModal}
          />
          <KeyboardAvoidingView
            pointerEvents="box-none"
            style={styles.ritualFormKeyboardAvoid}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
          >
            <View style={styles.ritualFormModalCenter} pointerEvents="box-none">
              <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalShell}>
                <View style={styles.ritualFormCardElevated}>
                  <TranslucentCard opacity={1.06} style={styles.ritualFormCardInner}>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                    onScrollBeginDrag={Keyboard.dismiss}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.ritualFormScrollContent}
                  >
                  <ThemedText type="defaultSemiBold" style={styles.ritualFormTitle}>
                    {editRitualId ? "Edit ritual" : "Add ritual"}
                  </ThemedText>

                  <View style={styles.ritualFormSection}>
                    <ThemedText type="muted" style={styles.ritualFormLabel}>
                      NAME
                    </ThemedText>
                    <TextInput
                      style={styles.ritualFormInput}
                      value={name}
                      onChangeText={setName}
                      placeholder="ex. Morning breathwork"
                      placeholderTextColor="rgba(255,255,255,0.48)"
                      autoCapitalize="sentences"
                    />
                  </View>

                  <View style={styles.ritualFormSection}>
                    <ThemedText type="muted" style={styles.ritualFormLabel}>
                      INTENTION
                    </ThemedText>
                    <TextInput
                      style={styles.ritualFormInput}
                      value={intention}
                      onChangeText={setIntention}
                      placeholder="ex. I tune in to my life force"
                      placeholderTextColor="rgba(255,255,255,0.48)"
                    />
                  </View>

                  <View style={styles.ritualReminderRow}>
                    <ThemedText type="muted" style={styles.ritualReminderLabel}>
                      Reminder
                    </ThemedText>
                    <Switch value={reminderEnabled} onValueChange={setReminderEnabled} />
                  </View>

                  {reminderEnabled && (
                    <View style={styles.ritualFormTimeWrap}>
                      {Platform.OS === "ios" ? (
                        <View style={styles.ritualTimePill}>
                          <ThemedText
                            type="defaultSemiBold"
                            style={styles.ritualTimePillText}
                            pointerEvents="none"
                          >
                            {displayTime(reminderTime)}
                          </ThemedText>
                          <DateTimePicker
                            style={styles.ritualTimePickerTouchOverlay}
                            value={reminderTime}
                            mode="time"
                            display="compact"
                            onChange={(_, date) => {
                              if (date) setReminderTime(date)
                            }}
                          />
                        </View>
                      ) : (
                        <Pressable
                          accessibilityRole="button"
                          style={styles.ritualTimePill}
                          onPress={openAndroidReminderTimePicker}
                        >
                          <ThemedText type="defaultSemiBold" style={styles.ritualTimePillText}>
                            {displayTime(reminderTime)}
                          </ThemedText>
                        </Pressable>
                      )}
                      <ThemedText type="muted" style={styles.reminderCaption}>
                        Daily reminder • {displayTime(reminderTime)}
                      </ThemedText>
                    </View>
                  )}

                  <View style={styles.ritualFormButtons}>
                    <Pressable
                      style={styles.ritualFormGhostButton}
                      onPress={closeAddRitualModal}
                    >
                      <ThemedText type="defaultSemiBold" style={styles.ritualFormGhostButtonText}>
                        Cancel
                      </ThemedText>
                    </Pressable>
                    <Pressable style={styles.ritualFormPrimaryButton} onPress={addRitual}>
                      <ThemedText type="defaultSemiBold" style={styles.ritualFormPrimaryButtonText}>
                        {editRitualId ? "Save" : "Add"}
                      </ThemedText>
                    </Pressable>
                  </View>
                  </ScrollView>
                </TranslucentCard>
                </View>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      ) : null}

      <Modal
        visible={markOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMarkOpen(false)}
      >
        <View style={styles.ritualFormModalRoot}>
          <BlurView
            intensity={Platform.OS === "ios" ? 62 : 50}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            accessibilityRole="button"
            style={styles.ritualFormModalDim}
            onPress={() => setMarkOpen(false)}
          />
          <View style={styles.ritualFormModalCenter} pointerEvents="box-none">
            <Pressable onPress={(e) => e.stopPropagation()} style={styles.markTrackerShell}>
              <View style={styles.ritualFormCardElevated}>
                <TranslucentCard opacity={1.06} style={styles.markTrackerCardInner}>
                  <View style={styles.markGrid}>
                    <View style={styles.markRow}>
                      <Pressable
                        style={styles.markBtn}
                        onPress={() => {
                          if (activeRitualId && activeISO)
                            setMark(activeRitualId, activeISO, "yes")
                          setMarkOpen(false)
                        }}
                      >
                        <ThemedText type="defaultSemiBold" style={styles.markBtnLabel}>
                          Yes
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        style={styles.markBtn}
                        onPress={() => {
                          if (activeRitualId && activeISO)
                            setMark(activeRitualId, activeISO, "no")
                          setMarkOpen(false)
                        }}
                      >
                        <ThemedText type="defaultSemiBold" style={styles.markBtnLabel}>
                          No
                        </ThemedText>
                      </Pressable>
                    </View>
                    <View style={styles.markRow}>
                      <Pressable
                        style={styles.markBtn}
                        onPress={() => {
                          if (activeRitualId && activeISO)
                            setMark(activeRitualId, activeISO, "empty")
                          setMarkOpen(false)
                        }}
                      >
                        <ThemedText type="defaultSemiBold" style={styles.markBtnLabel}>
                          Erase
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        style={styles.markBtn}
                        onPress={() => {
                          if (activeRitualId && activeISO)
                            setMark(activeRitualId, activeISO, "skip")
                          setMarkOpen(false)
                        }}
                      >
                        <ThemedText type="defaultSemiBold" style={styles.markBtnLabel}>
                          Skip
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </TranslucentCard>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!deleteTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View style={styles.ritualFormModalRoot}>
          <BlurView
            intensity={Platform.OS === "ios" ? 62 : 50}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            accessibilityRole="button"
            style={styles.ritualFormModalDim}
            onPress={() => setDeleteTarget(null)}
          />
          <View style={styles.ritualFormModalCenter} pointerEvents="box-none">
            <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalShell}>
              <View style={styles.ritualFormCardElevated}>
                <TranslucentCard opacity={1.06} style={styles.ritualFormCardInner}>
                  <ThemedText type="defaultSemiBold" style={styles.deleteConfirmTitle}>
                    Delete ritual?
                  </ThemedText>

                  <ThemedText type="muted" style={styles.deleteConfirmBody}>
                    This will remove the ritual and its history.
                  </ThemedText>

                  <View
                    style={[
                      styles.deleteConfirmButtonRow,
                      deleteConfirmNarrowLayout && styles.deleteConfirmButtonRowStacked,
                    ]}
                  >
                    <Pressable
                      style={[
                        styles.ritualFormGhostButton,
                        !deleteConfirmNarrowLayout && styles.deleteConfirmBtnFlex,
                        deleteConfirmNarrowLayout && styles.deleteConfirmBtnFullWidth,
                      ]}
                      onPress={() => setDeleteTarget(null)}
                    >
                      <ThemedText type="defaultSemiBold" style={styles.ritualFormGhostButtonText}>
                        cancel
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.deleteConfirmDestructive,
                        !deleteConfirmNarrowLayout && styles.deleteConfirmBtnFlex,
                        deleteConfirmNarrowLayout && styles.deleteConfirmBtnFullWidth,
                      ]}
                      onPress={async () => {
                        const target = deleteTarget
                        if (!target) return

                        try {
                          await cancelScheduledNotification(target.notificationId)
                        } catch (e) {
                          console.warn("Failed to cancel notification", target.notificationId, e)
                        }

                        remove(target.id)
                        await reconcileRitualReminderNotifications(
                          useRitualsStore.getState().rituals
                        )
                        setDeleteTarget(null)
                      }}
                    >
                      <ThemedText type="defaultSemiBold" style={styles.deleteConfirmDestructiveText}>
                        delete
                      </ThemedText>
                    </Pressable>
                  </View>
                </TranslucentCard>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>

      {showReminderNotifPrompt && !showAdd ? (
      <NotificationPermissionModal
        visible
        title={STAY_IN_RHYTHM_PROMPT.title}
        body={STAY_IN_RHYTHM_PROMPT.body}
        primaryLabel={STAY_IN_RHYTHM_PROMPT.primaryLabel}
        secondaryLabel={STAY_IN_RHYTHM_PROMPT.secondaryLabel}
        onPrimary={() => void handleAddNotifPromptPrimary()}
        onSecondary={handleAddNotifPromptSecondary}
        onRequestClose={handleAddNotifPromptClose}
      />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, minHeight: 0 },
  headerBlock: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
    flexShrink: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 6,
  },
  addButtonText: { color: "white", fontSize: 14 },
  addRitualBtn: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: GLASS.bgDark,
    borderWidth: 1,
    borderColor: GLASS.borderDark,
  },
  addRitualText: { opacity: 0.9 },
  weekNavRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  weekNavColLeft: { width: 64 },
  weekNavColCenter: { flex: 1, alignItems: "center" },
  weekNavColRight: { width: 64, alignItems: "flex-end" },
  weekNavBtnText: { fontSize: 12, color: "rgba(255,255,255,0.9)" },
  weekNavRangeText: { textAlign: "center", opacity: 0.9 },
  weekHeaderCard: {
    marginTop: 12,
    marginBottom: 10,
    flexShrink: 0,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  weekCell: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
  },
  weekCellToday: { backgroundColor: "rgba(255,255,255,0.12)" },
  weekCellSelected: { borderColor: "rgba(255,255,255,0.38)", borderWidth: 1 },
  weekLabel: { fontSize: 12, lineHeight: 14, opacity: 0.75 },
  weekDate: { marginTop: 2, fontSize: 12, lineHeight: 14, opacity: 0.85 },
  weekLabelToday: { opacity: 1, fontWeight: "600" },
  list: { flex: 1 },
  listContent: { gap: 12 },
  ritualRow: { padding: 12 },
  ritualHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  ritualTitleBlock: {
    flex: 1,
    marginRight: 12,
  },
  ritualName: { fontSize: 16 },
  ritualIntention: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.82,
  },
  ritualHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  streakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  streakText: {
    fontSize: 12,
    opacity: 0.9,
  },
  ritualActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionText: {
    fontSize: 12,
    opacity: 0.9,
  },
  deleteText: {
    opacity: 0.8,
  },
  dayRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    width: "100%",
  },
  dayBoxToday: {
    borderColor: "rgba(255,255,255,0.4)",
    borderWidth: 1.5,
  },
  dayBoxFuture: { opacity: 0.35 },
  cardTitle: { fontSize: 16 },
  cardBody: { marginTop: 6 },
  emptyCard: { padding: 16 },
  emptyBody: { marginTop: 8, fontSize: 14 },
  examplesLabel: { fontSize: 11, marginTop: 12, marginBottom: 8, opacity: 0.8 },
  exampleList: { gap: 6 },
  exampleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  exampleBullet: { fontSize: 14 },
  exampleLabel: { fontSize: 16 },
  emptyAddButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(100, 140, 120, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(120, 160, 140, 0.4)",
  },
  emptyAddButtonText: { fontSize: 14, color: "white" },
  ritualFormModalRoot: {
    flex: 1,
    backgroundColor: "transparent",
  },
  ritualFormModalDim: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      android: {
        backgroundColor: "rgba(0, 0, 0, 0.72)",
      },
      default: {
        backgroundColor: "rgba(9, 18, 14, 0.44)",
      },
    }),
  },
  ritualFormModalCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  ritualFormKeyboardAvoid: {
    flex: 1,
  },
  ritualFormCardElevated: {
    width: "100%",
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.48,
        shadowRadius: 40,
      },
      android: {
        elevation: 26,
      },
      default: {},
    }),
  },
  ritualFormCardInner: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    overflow: "hidden",
  },
  ritualFormScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  ritualFormTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.35,
    color: "#FFFFFF",
    marginBottom: 22,
  },
  ritualFormSection: {
    marginBottom: 18,
  },
  ritualFormLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.35,
    textTransform: "uppercase",
    marginBottom: 9,
    color: "rgba(255,255,255,0.72)",
  },
  ritualFormInput: {
    backgroundColor: "rgba(255,255,255,0.065)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    paddingVertical: 14,
    paddingHorizontal: 17,
    fontSize: 16,
    color: "#FFFFFF",
    minHeight: 50,
  },
  ritualFormTimeWrap: {
    marginTop: 8,
    marginBottom: 8,
    paddingBottom: 4,
  },
  ritualTimePicker: {
    alignSelf: "flex-start",
  },
  ritualTimePill: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignSelf: "flex-start",
    position: "relative",
    justifyContent: "center",
  },
  ritualTimePillText: {
    color: "#102018",
    fontSize: 18,
    fontWeight: "600",
  },
  ritualTimePickerTouchOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    opacity: 0.02,
    zIndex: 10,
  },
  ritualReminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 6,
    marginBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
  },
  ritualReminderLabel: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.15,
    color: "rgba(255,255,255,0.82)",
    flex: 1,
    marginRight: 16,
  },
  reminderCaption: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: 0.12,
    color: "rgba(255,255,255,0.72)",
  },
  ritualFormButtons: {
    flexDirection: "row",
    gap: 16,
    marginTop: 26,
    alignItems: "stretch",
  },
  ritualFormGhostButton: {
    flex: 1,
    paddingVertical: 15,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  ritualFormGhostButtonText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  ritualFormPrimaryButton: {
    flex: 1,
    paddingVertical: 15,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: "rgba(110, 162, 132, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(140, 190, 160, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  ritualFormPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.25,
  },
  modalShell: {
    width: "100%",
    maxWidth: 360,
  },
  /** Delete confirmation: typography/spacing aligned with Edit ritual modal title + body rhythm */
  deleteConfirmTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.35,
    color: "#FFFFFF",
    marginBottom: 14,
  },
  deleteConfirmBody: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
  },
  deleteConfirmButtonRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  deleteConfirmButtonRowStacked: {
    flexDirection: "column",
  },
  deleteConfirmBtnFlex: {
    flex: 1,
    minWidth: 0,
  },
  deleteConfirmBtnFullWidth: {
    alignSelf: "stretch",
    width: "100%",
  },
  /** Red glass destructive — same footprint as ritualFormGhostButton / edit Cancel */
  deleteConfirmDestructive: {
    paddingVertical: 15,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 120, 120, 0.42)",
    backgroundColor: "rgba(255, 80, 80, 0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteConfirmDestructiveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  inputLabel: { fontSize: 12, marginBottom: 6, color: "rgba(255,255,255,0.7)" },
  reminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  timePickerWrap: { marginBottom: 16 },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "white",
    marginBottom: 16,
  },
  /** Tracker popup: narrower shell than full Add Ritual form — keeps 2×2 compact */
  markTrackerShell: {
    width: "100%",
    maxWidth: 300,
  },
  /** Matches Add Ritual inner card border/radius; slightly tighter than full form for compact 2×2 */
  markTrackerCardInner: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    overflow: "hidden",
  },
  /** Two rows × two columns; explicit rows avoid RN % width + gap flexWrap issues. */
  markGrid: {
    width: "100%",
    flexDirection: "column",
    gap: 12,
    alignItems: "stretch",
  },
  markRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    alignItems: "stretch",
  },
  markBtn: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 16,
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  markBtnLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
})
