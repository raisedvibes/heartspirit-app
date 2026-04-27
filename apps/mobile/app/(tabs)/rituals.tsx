import { useEffect, useState, useRef, useCallback } from "react"
import { useFocusEffect } from "expo-router"
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  type FlatList as RNFlatList,
} from "react-native"
import Animated from "react-native-reanimated"
import * as Notifications from "expo-notifications"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ScreenContent, { getTabBarBottomPadding } from "@/components/layout/ScreenContent"
import { useCollapsibleTabHeader } from "@/hooks/useCollapsibleTabHeader"
import BottomFade from "@/components/ui/BottomFade"
import TranslucentCard from "../../components/ui/TranslucentCard"
import { ThemedText } from "@/components/themed-text"
import {
  useRitualsStore,
  todayISO,
  localISODate,
  type Ritual,
  type Mark,
} from "../../lib/ritualsStore"
import { computeStreak } from "../../lib/ritualStats"
import {
  ensureNotifPermissions,
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

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"]

type RitualsListRow =
  | { _type: "headerTitle"; id: string }
  | { _type: "headerWeek"; id: string }
  | { _type: "empty"; id: string }
  | Ritual

export default function RitualsScreen() {
  const insets = useSafeAreaInsets()
  const { animatedScreenOuterStyle, scrollHandler } = useCollapsibleTabHeader("rituals")
  const rituals = useRitualsStore((s) => s.rituals)
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
    rituals.length === 0
      ? [headerTitleItem, headerWeekItem, emptyItem]
      : [headerTitleItem, headerWeekItem, ...ritualsSorted]
  const flatListRef = useRef<RNFlatList<RitualsListRow>>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [editRitualId, setEditRitualId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [intention, setIntention] = useState("")
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState<Date>(() => new Date())

  const [markOpen, setMarkOpen] = useState(false)
  const [activeRitualId, setActiveRitualId] = useState<string | null>(null)
  const [activeISO, setActiveISO] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ritual | null>(null)

  const addRitual = async () => {
    if (!name.trim()) return
    const now = new Date().toISOString()

    if (editRitualId) {
      const existing = rituals.find((x) => x.id === editRitualId)
      if (!existing) return

      const oldReminder = existing.reminder
      const newReminder = reminderEnabled ? hhmm(reminderTime) : undefined

      let notificationId = existing.notificationId

      if (oldReminder !== newReminder) {
        if (notificationId) {
          await Notifications.cancelScheduledNotificationAsync(notificationId)
          notificationId = undefined
        }

        if (newReminder) {
          const ok = await ensureNotifPermissions()
          if (ok) {
            notificationId = await scheduleDailyReminder(
              "Ritual reminder",
              `Time for: ${name.trim()}`,
              reminderTime
            )
          } else {
            console.warn("Notifications not granted; reminder will not fire.")
          }
        }
      }

      upsert({
        ...existing,
        name: name.trim(),
        intention: intention.trim() ? intention.trim() : undefined,
        tags: existing.tags ?? [],
        reminder: newReminder,
        notificationId,
        updatedAt: now,
      })

      setEditRitualId(null)
      setName("")
      setIntention("")
      setReminderEnabled(false)
      setReminderTime(new Date())
      setShowAdd(false)
      return
    }

    const id =
      globalThis.crypto && "randomUUID" in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : String(Date.now())

    let notificationId: string | undefined = undefined
    if (reminderEnabled) {
      const ok = await ensureNotifPermissions()
      if (ok) {
        notificationId = await scheduleDailyReminder(
          "Ritual reminder",
          `Time for: ${name.trim()}`,
          reminderTime
        )
      } else {
        console.warn("Notifications not granted; reminder will not fire.")
      }
    }

    upsert({
      id,
      name: name.trim(),
      intention: intention.trim() ? intention.trim() : undefined,
      tags: [],
      reminder: reminderEnabled ? hhmm(reminderTime) : undefined,
      notificationId,
      history: {},
      createdAt: now,
      updatedAt: now,
    })
    requestAnimationFrame(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }))
    setEditRitualId(null)
    setName("")
    setIntention("")
    setReminderEnabled(false)
    setReminderTime(new Date())
    setShowAdd(false)
  }

  return (
    <View style={styles.root}>
      <ScreenContent animatedOuterStyle={animatedScreenOuterStyle}>
        <View style={styles.inner}>
          <Animated.FlatList<RitualsListRow>
            ref={flatListRef}
            data={listData as RitualsListRow[]}
            keyExtractor={(item) => (item as { id: string }).id}
            style={{ flex: 1 }}
            contentContainerStyle={[styles.listContent, { paddingBottom: getTabBarBottomPadding(insets) }]}
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
                        onPress={() => {
                          setEditRitualId(null)
                          setShowAdd(true)
                        }}
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
                          style={styles.weekNavColLeft}
                          onPress={() => setWeekAnchor(addDays(weekAnchor, -7))}
                        >
                          <ThemedText type="default" style={styles.weekNavBtnText}>back</ThemedText>
                        </Pressable>
                        <Pressable
                          style={styles.weekNavColCenter}
                          onPress={() => setWeekAnchor(new Date())}
                        >
                          <ThemedText type="default" style={styles.weekNavRangeText}>
                            {formatWeekRange(days)}
                          </ThemedText>
                        </Pressable>
                        <Pressable
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
                        No rituals yet — add a ritual to create.
                      </ThemedText>
                      <ThemedText type="muted" style={styles.emptyBody}>
                        A ritual elevates a practice by intentionally connecting to heart.
                      </ThemedText>
                      <ThemedText type="muted" style={styles.emptyBody}>
                        What is a ritual that can support you right now?
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
                        onPress={() => setShowAdd(true)}
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
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          borderWidth: 1,
                          alignItems: "center" as const,
                          justifyContent: "center" as const,
                          paddingTop: 2,
                          marginRight: 8,
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

      <Modal
        visible={showAdd}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setEditRitualId(null)
          setShowAdd(false)
          setIntention("")
          setReminderEnabled(false)
          setReminderTime(new Date())
        }}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            setEditRitualId(null)
            setShowAdd(false)
            setIntention("")
            setReminderEnabled(false)
            setReminderTime(new Date())
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalShell}>
            <TranslucentCard style={styles.modalCard}>
              <ScrollView>
                <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
                  {editRitualId ? "Edit ritual" : "Add ritual"}
                </ThemedText>

                <ThemedText type="muted" style={styles.inputLabel}>
                  Name
                </ThemedText>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                 
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  autoCapitalize="words"
                />

                <ThemedText type="muted" style={styles.inputLabel}>
                  How is my intention supported?
                </ThemedText>
                <TextInput
                  style={styles.input}
                  value={intention}
                  onChangeText={setIntention}
               
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />

                <View style={styles.reminderRow}>
                  <ThemedText type="muted" style={styles.inputLabel}>
                    Reminder
                  </ThemedText>
                  <Switch value={reminderEnabled} onValueChange={setReminderEnabled} />
                </View>
                {reminderEnabled && (
                  <View style={styles.timePickerWrap}>
                    <DateTimePicker
                      value={reminderTime}
                      mode="time"
                      display="default"
                      onChange={(_, date) => {
                        if (date) setReminderTime(date)
                      }}
                    />
                    <ThemedText type="muted" style={{ marginTop: 8 }}>
                      set for {hhmm(reminderTime)}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.modalButtons}>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => {
                      setEditRitualId(null)
                      setShowAdd(false)
                      setIntention("")
                      setReminderEnabled(false)
                      setReminderTime(new Date())
                    }}
                  >
                    <ThemedText type="defaultSemiBold" style={styles.cancelButtonText}>
                      cancel
                    </ThemedText>
                  </Pressable>
                  <Pressable style={styles.addSubmitButton} onPress={addRitual}>
                    <ThemedText type="defaultSemiBold" style={styles.addSubmitButtonText}>
                      {editRitualId ? "save" : "add"}
                    </ThemedText>
                  </Pressable>
                </View>
              </ScrollView>
            </TranslucentCard>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={markOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMarkOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setMarkOpen(false)}>
          <Pressable style={styles.markPopover} onPress={(e) => e.stopPropagation()}>
            <TranslucentCard style={styles.markCard}>
              <View style={styles.markGrid}>
                {[
                  { label: "Yes", value: "yes" as const },
                  { label: "No", value: "no" as const },
                  { label: "Erase", value: undefined },
                  { label: "Skip", value: "skip" as const },
                ].map((btn) => (
                  <Pressable
                    key={btn.label}
                    style={styles.markBtn}
                    onPress={() => {
                      if (activeRitualId && activeISO)
                        setMark(activeRitualId, activeISO, btn.value ?? "empty")
                      setMarkOpen(false)
                    }}
                  >
                    <ThemedText type="defaultSemiBold">{btn.label}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </TranslucentCard>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!deleteTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDeleteTarget(null)}>
          <Pressable style={styles.modalShell} onPress={(e) => e.stopPropagation()}>
            <TranslucentCard style={styles.modalCard}>
              <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
                Delete ritual?
              </ThemedText>

              <ThemedText type="muted" style={styles.modalBody}>
                This will remove the ritual and its history.
              </ThemedText>

              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setDeleteTarget(null)}
                >
                  <ThemedText type="defaultSemiBold" style={styles.cancelButtonText}>
                    cancel
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={[styles.addSubmitButton, styles.deleteButton]}
                  onPress={async () => {
                    const target = deleteTarget
                    if (!target) return

                    try {
                      if (target.notificationId) {
                        await Notifications.cancelScheduledNotificationAsync(target.notificationId)
                      }
                    } catch (e) {
                      console.warn("Failed to cancel notification", target.notificationId, e)
                    }

                    remove(target.id)
                    setDeleteTarget(null)
                  }}
                >
                  <ThemedText type="defaultSemiBold" style={styles.addSubmitButtonText}>
                    delete
                  </ThemedText>
                </Pressable>
              </View>
            </TranslucentCard>
          </Pressable>
        </Pressable>
      </Modal>
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
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
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
  listContent: { paddingBottom: 24, gap: 12 },
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
    flexWrap: "wrap",
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalShell: {
    width: "100%",
    maxWidth: 360,
  },
  modalCard: {
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: { fontSize: 18, color: "white", marginBottom: 16 },
  modalBody: {
    marginTop: 8,
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: "rgba(255, 80, 80, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(255, 120, 120, 0.35)",
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
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  cancelButtonText: { color: "white" },
  addSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "rgba(120, 170, 140, 0.65)",
    alignItems: "center",
  },
  addSubmitButtonText: { color: "white" },
  markPopover: { width: "100%", maxWidth: 360 },
  markCard: { padding: 12 },
  markGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  markBtn: {
    width: "48%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.10)",
  },
})