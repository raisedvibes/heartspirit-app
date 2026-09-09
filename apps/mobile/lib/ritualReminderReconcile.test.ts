import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  applyNotificationIdPatchesToRituals,
  findMatchingRitualNotification,
  notificationLooksLikeRitualReminder,
  parseRitualReminderHhmm,
  planRitualReminderReconciliation,
  shouldCancelLeftoverRitualRemindersOnEmptyHydrate,
  shouldCancelOutgoingRitualReminders,
  type PendingLocalNotification,
  type RitualReminderSnapshot,
} from "./ritualReminderReconcile.ts"

function ritual(
  overrides: Partial<RitualReminderSnapshot> & Pick<RitualReminderSnapshot, "id" | "name">
): RitualReminderSnapshot {
  return overrides
}

function pending(partial: {
  identifier: string
  title?: string
  type?: string
  ritualId?: string
  channelId?: string
}): PendingLocalNotification {
  const data: Record<string, unknown> = {}
  if (partial.type) data.type = partial.type
  if (partial.ritualId) data.ritualId = partial.ritualId
  return {
    identifier: partial.identifier,
    content: {
      title: partial.title ?? null,
      data,
    },
    trigger: partial.channelId ? { channelId: partial.channelId } : undefined,
  }
}

describe("parseRitualReminderHhmm", () => {
  it("accepts valid HH:MM", () => {
    assert.deepEqual(parseRitualReminderHhmm("15:00"), { hour: 15, minute: 0 })
    assert.deepEqual(parseRitualReminderHhmm("3:50"), { hour: 3, minute: 50 })
  })

  it("rejects missing or invalid reminder", () => {
    assert.equal(parseRitualReminderHhmm(undefined), null)
    assert.equal(parseRitualReminderHhmm(""), null)
    assert.equal(parseRitualReminderHhmm("24:00"), null)
    assert.equal(parseRitualReminderHhmm("12:60"), null)
    assert.equal(parseRitualReminderHhmm("noon"), null)
  })
})

describe("planRitualReminderReconciliation", () => {
  it("existing valid reminder → no duplicate created", () => {
    const rituals = [
      ritual({
        id: "r1",
        name: "Morning",
        reminder: "15:00",
        notificationId: "os-1",
      }),
    ]
    const os = [
      pending({
        identifier: "os-1",
        title: "Ritual: Morning",
        type: "ritual_reminder",
        ritualId: "r1",
      }),
    ]

    const plan = planRitualReminderReconciliation(rituals, os)

    assert.deepEqual(plan.keepIds, ["os-1"])
    assert.deepEqual(plan.recreate, [])
    assert.deepEqual(plan.patches, [])
    assert.deepEqual(plan.verifiedRitualIds, ["r1"])
    assert.deepEqual(plan.orphanIds, [])
  })

  it("reminder ON + missing OS schedule → recreated", () => {
    const rituals = [
      ritual({
        id: "r1",
        name: "Morning",
        reminder: "15:00",
        notificationId: "stale-id",
      }),
    ]

    const plan = planRitualReminderReconciliation(rituals, [])

    assert.deepEqual(plan.keepIds, [])
    assert.deepEqual(plan.missingRitualIds, ["r1"])
    assert.deepEqual(plan.recreate, [
      { ritualId: "r1", ritualName: "Morning", hhmm: "15:00" },
    ])
    assert.deepEqual(plan.orphanIds, [])
  })

  it("stale notificationId + matching ritualId OS notification → stored ID repaired, no duplicate", () => {
    const rituals = [
      ritual({
        id: "r1",
        name: "Morning",
        reminder: "15:00",
        notificationId: "old-id",
      }),
    ]
    const os = [
      pending({
        identifier: "live-id",
        title: "Ritual: Morning",
        type: "ritual_reminder",
        ritualId: "r1",
      }),
    ]

    const plan = planRitualReminderReconciliation(rituals, os)

    assert.deepEqual(plan.keepIds, ["live-id"])
    assert.deepEqual(plan.recreate, [])
    assert.deepEqual(plan.patches, [{ ritualId: "r1", notificationId: "live-id" }])
    assert.deepEqual(plan.repairedRitualIds, ["r1"])
    assert.deepEqual(plan.orphanIds, [])
  })

  it("legacy title-only OS notification is matched without creating a duplicate", () => {
    const rituals = [
      ritual({
        id: "r1",
        name: "Morning",
        reminder: "15:00",
      }),
    ]
    const os = [
      pending({
        identifier: "legacy-id",
        title: "Ritual: Morning",
      }),
    ]

    const plan = planRitualReminderReconciliation(rituals, os)

    assert.deepEqual(plan.keepIds, ["legacy-id"])
    assert.deepEqual(plan.recreate, [])
    assert.deepEqual(plan.patches, [{ ritualId: "r1", notificationId: "legacy-id" }])
  })

  it("reminder OFF → not recreated", () => {
    const rituals = [
      ritual({
        id: "r1",
        name: "Morning",
        notificationId: "os-1",
      }),
    ]
    const os = [
      pending({
        identifier: "os-1",
        title: "Ritual: Morning",
        type: "ritual_reminder",
        ritualId: "r1",
      }),
    ]

    const plan = planRitualReminderReconciliation(rituals, os)

    assert.deepEqual(plan.recreate, [])
    assert.deepEqual(plan.keepIds, [])
    assert.deepEqual(plan.orphanIds, ["os-1"])
  })

  it("orphan ritual notification → removed", () => {
    const rituals = [
      ritual({
        id: "r1",
        name: "Morning",
        reminder: "15:00",
        notificationId: "os-1",
      }),
    ]
    const os = [
      pending({
        identifier: "os-1",
        title: "Ritual: Morning",
        type: "ritual_reminder",
        ritualId: "r1",
      }),
      pending({
        identifier: "orphan-id",
        title: "Ritual: Deleted",
        type: "ritual_reminder",
        ritualId: "gone",
      }),
    ]

    const plan = planRitualReminderReconciliation(rituals, os)

    assert.deepEqual(plan.keepIds, ["os-1"])
    assert.deepEqual(plan.recreate, [])
    assert.deepEqual(plan.orphanIds, ["orphan-id"])
  })

  it("duplicate ritualId OS notification keeps one and orphans the rest", () => {
    const rituals = [
      ritual({
        id: "r1",
        name: "Morning",
        reminder: "15:00",
        notificationId: "os-1",
      }),
    ]
    const os = [
      pending({
        identifier: "os-1",
        title: "Ritual: Morning",
        type: "ritual_reminder",
        ritualId: "r1",
      }),
      pending({
        identifier: "os-dup",
        title: "Ritual: Morning",
        type: "ritual_reminder",
        ritualId: "r1",
      }),
    ]

    const plan = planRitualReminderReconciliation(rituals, os)

    assert.deepEqual(plan.keepIds, ["os-1"])
    assert.deepEqual(plan.recreate, [])
    assert.deepEqual(plan.orphanIds, ["os-dup"])
  })

  it("practice timer notification → untouched", () => {
    const rituals = [
      ritual({
        id: "r1",
        name: "Morning",
        reminder: "15:00",
        notificationId: "os-1",
      }),
    ]
    const practiceTimer = pending({
      identifier: "timer-1",
      title: "Practice complete",
      type: "practice_timer_complete",
    })
    const os = [
      pending({
        identifier: "os-1",
        title: "Ritual: Morning",
        type: "ritual_reminder",
        ritualId: "r1",
      }),
      practiceTimer,
    ]

    const plan = planRitualReminderReconciliation(rituals, os)

    assert.equal(notificationLooksLikeRitualReminder(practiceTimer), false)
    assert.deepEqual(plan.keepIds, ["os-1"])
    assert.ok(!plan.orphanIds.includes("timer-1"))
    assert.ok(!plan.keepIds.includes("timer-1"))
  })

  it("two same-name reminder-enabled rituals share one legacy OS notification one-to-one", () => {
    const rituals = [
      ritual({ id: "r1", name: "Morning", reminder: "08:00" }),
      ritual({ id: "r2", name: "Morning", reminder: "15:00" }),
    ]
    const os = [
      pending({
        identifier: "legacy-morning",
        title: "Ritual: Morning",
      }),
    ]

    const plan = planRitualReminderReconciliation(rituals, os)

    assert.equal(plan.keepIds.filter((id) => id === "legacy-morning").length, 1)
    assert.deepEqual(plan.keepIds, ["legacy-morning"])
    assert.equal(plan.recreate.length, 1)
    assert.ok(
      plan.recreate[0].ritualId === "r1" || plan.recreate[0].ritualId === "r2"
    )
    const claimedRitualId = plan.patches[0]?.ritualId
    assert.ok(claimedRitualId)
    assert.notEqual(plan.recreate[0].ritualId, claimedRitualId)
    assert.deepEqual(plan.orphanIds, [])
    assert.equal(new Set(plan.keepIds).size, plan.keepIds.length)
  })
})

describe("findMatchingRitualNotification", () => {
  it("does not treat a practice timer as a stored-id match", () => {
    const match = findMatchingRitualNotification(
      ritual({ id: "r1", name: "Morning", reminder: "15:00", notificationId: "timer-1" }),
      [
        pending({
          identifier: "timer-1",
          title: "Practice complete",
          type: "practice_timer_complete",
        }),
      ],
      new Set()
    )
    assert.equal(match, undefined)
  })
})

describe("applyNotificationIdPatchesToRituals", () => {
  it("returns the same array when nothing changes", () => {
    const rituals = [
      ritual({ id: "r1", name: "Morning", notificationId: "os-1" }),
    ]
    const next = applyNotificationIdPatchesToRituals(rituals, [
      { ritualId: "r1", notificationId: "os-1" },
    ])
    assert.equal(next, rituals)
  })

  it("patches only notificationId", () => {
    const rituals = [
      ritual({ id: "r1", name: "Morning", reminder: "15:00", notificationId: "old" }),
    ]
    const next = applyNotificationIdPatchesToRituals(rituals, [
      { ritualId: "r1", notificationId: "live" },
    ])
    assert.notEqual(next, rituals)
    assert.equal(next[0].notificationId, "live")
    assert.equal(next[0].reminder, "15:00")
  })

  it("delete-path patches persist immediately so a later edit does not duplicate", () => {
    const remainingAfterDelete = [
      ritual({ id: "r2", name: "Evening", reminder: "15:00" }),
    ]
    const patches = [{ ritualId: "r2", notificationId: "created-after-delete" }]
    const persisted = applyNotificationIdPatchesToRituals(
      remainingAfterDelete,
      patches
    )
    assert.equal(persisted[0].notificationId, "created-after-delete")

    const pendingAfterDeleteReconcile = [
      pending({
        identifier: "created-after-delete",
        title: "Ritual: Evening",
        type: "ritual_reminder",
        ritualId: "r2",
      }),
    ]
    const beforeEdit = planRitualReminderReconciliation(
      persisted,
      pendingAfterDeleteReconcile
    )
    assert.deepEqual(beforeEdit.recreate, [])
    assert.deepEqual(beforeEdit.keepIds, ["created-after-delete"])
    assert.deepEqual(beforeEdit.orphanIds, [])

    const afterEditPending = [
      pending({
        identifier: "edit-new",
        title: "Ritual: Evening",
        type: "ritual_reminder",
        ritualId: "r2",
      }),
    ]
    const afterEdit = planRitualReminderReconciliation(
      [{ ...persisted[0], notificationId: "edit-new", reminder: "15:50" }],
      afterEditPending
    )
    assert.deepEqual(afterEdit.keepIds, ["edit-new"])
    assert.deepEqual(afterEdit.recreate, [])
    assert.deepEqual(afterEdit.orphanIds, [])

    const duplicateIfUnpersisted = planRitualReminderReconciliation(
      remainingAfterDelete,
      [
        ...pendingAfterDeleteReconcile,
        pending({
          identifier: "edit-new",
          title: "Ritual: Evening",
          type: "ritual_reminder",
          ritualId: "r2",
        }),
      ]
    )
    assert.equal(duplicateIfUnpersisted.keepIds.length, 1)
    assert.ok(
      duplicateIfUnpersisted.orphanIds.includes("edit-new") ||
        duplicateIfUnpersisted.orphanIds.includes("created-after-delete")
    )
  })
})

describe("shouldCancelOutgoingRitualReminders", () => {
  it("does not cancel on first assignment or session-null restoration", () => {
    assert.equal(shouldCancelOutgoingRitualReminders(undefined, null), false)
    assert.equal(shouldCancelOutgoingRitualReminders(undefined, "user-a"), false)
    assert.equal(shouldCancelOutgoingRitualReminders(null, "user-a"), false)
    assert.equal(shouldCancelOutgoingRitualReminders(null, null), false)
  })

  it("account switch isolation still works; logout OS cancel is explicit, not session-null", () => {
    assert.equal(shouldCancelOutgoingRitualReminders("user-a", "user-b"), true)
    assert.equal(shouldCancelOutgoingRitualReminders("user-a", "user-a"), false)
    assert.equal(shouldCancelOutgoingRitualReminders("user-a", null), false)
  })
})

describe("shouldCancelLeftoverRitualRemindersOnEmptyHydrate", () => {
  it("does not wipe schedules during transient anonymous hydration", () => {
    assert.equal(shouldCancelLeftoverRitualRemindersOnEmptyHydrate(false, null), false)
  })

  it("still clears leftovers for empty authenticated accounts and logout", () => {
    assert.equal(shouldCancelLeftoverRitualRemindersOnEmptyHydrate(false, "user-a"), true)
    assert.equal(shouldCancelLeftoverRitualRemindersOnEmptyHydrate(true, null), true)
    assert.equal(shouldCancelLeftoverRitualRemindersOnEmptyHydrate(true, "user-b"), true)
  })
})

describe("session-null restoration sequence", () => {
  it("authenticated reminder survives transient anonymous restore without duplicate", () => {
    const rituals = [
      ritual({
        id: "r1",
        name: "Morning",
        reminder: "15:00",
        notificationId: "os-1",
      }),
    ]
    const os = [
      pending({
        identifier: "os-1",
        title: "Ritual: Morning",
        type: "ritual_reminder",
        ritualId: "r1",
      }),
    ]

    const before = planRitualReminderReconciliation(rituals, os)
    assert.deepEqual(before.keepIds, ["os-1"])
    assert.deepEqual(before.recreate, [])
    assert.deepEqual(before.patches, [])

    assert.equal(shouldCancelOutgoingRitualReminders("user-a", null), false)
    assert.equal(shouldCancelLeftoverRitualRemindersOnEmptyHydrate(false, null), false)
    assert.equal(shouldCancelOutgoingRitualReminders(null, "user-a"), false)

    const after = planRitualReminderReconciliation(rituals, os)
    assert.deepEqual(after.keepIds, ["os-1"])
    assert.deepEqual(after.recreate, [])
    assert.deepEqual(after.patches, [])
    assert.deepEqual(after.orphanIds, [])
    assert.equal(rituals[0].notificationId, "os-1")
  })
})
