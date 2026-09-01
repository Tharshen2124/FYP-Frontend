import { describe, it, expect } from "vitest"
import {
  findLinkSelection,
  fromApiTask,
  getLinkMeta,
  hasWeeklyPriority,
  isScheduleDirty,
  taskCategories,
  toTasksPayload,
} from "@/app/weekly-plan/_utils/tasks"
import type { PlanDimension, PlanRole } from "@/app/weekly-plan/_types"
import type { Appt, Task } from "@/app/weekly-plan/_types/calendar"
import type { ApiPlanTask } from "@/lib/api"

// Stand-ins for what the API returns for the week being planned: roles carry the goals they hold
// in that week, dimensions carry only the activities committed to it.
const ROLES: PlanRole[] = [
  {
    id: "11",
    name: "Professional",
    color: "#B13BFF",
    goals: [
      { id: "1", text: "Ship the report", isWeeklyPriority: false },
      // The same role holds both, which is the case that matters: the yellow has to come off the
      // goal rather than off the role, or one priority would repaint every task under it.
      { id: "3", text: "Submit the paper", isWeeklyPriority: true },
    ],
  },
  { id: "12", name: "Health", color: "#14b8a6", goals: [{ id: "2", text: "Run 5km", isWeeklyPriority: false }] },
]

const DIMENSIONS: PlanDimension[] = [
  { id: "physical", label: "Physical", color: "#f97316", icon: () => null, activities: [{ id: "7", text: "Morning run" }] },
  { id: "mental", label: "Mental", color: "#14b8a6", icon: () => null, activities: [] },
]

const base = {
  selectedRoleId: "",
  selectedGoalId: "",
  selectedDimensionId: "",
  selectedActivityId: "",
}

const apiTask = (over: Partial<ApiPlanTask> = {}): ApiPlanTask => ({
  task_id: 99,
  title: "Deep work",
  day_of_week: 2,
  start_time: "09:00",
  end_time: "10:30",
  goal_id: 1,
  sharpen_the_saw_activity_id: null,
  is_daily_priority: false,
  is_completed: false,
  ...over,
})

describe("getLinkMeta", () => {
  it("returns the goal's id, the role colour and a 'Role — Goal' label", () => {
    expect(
      getLinkMeta({ ...base, linkType: "role-goal", selectedRoleId: "11", selectedGoalId: "1" }, ROLES, DIMENSIONS)
    ).toEqual({ id: "1", color: "#B13BFF", label: "Professional — Ship the report" })
  })

  /* The reservation, at the point a task is given its colour: a weekly-priority goal overrides
     the role's own colour, and its sibling under the same role does not. */
  it("gives a weekly-priority goal the reserved yellow instead of its role's colour", () => {
    expect(
      getLinkMeta({ ...base, linkType: "role-goal", selectedRoleId: "11", selectedGoalId: "3" }, ROLES, DIMENSIONS)
    ).toEqual({ id: "3", color: "#FFCC00", label: "Professional — Submit the paper" })
  })

  it("returns the activity's id, the dimension colour and a 'Dimension — Activity' label", () => {
    expect(
      getLinkMeta(
        { ...base, linkType: "sharpen-the-saw", selectedDimensionId: "physical", selectedActivityId: "7" },
        ROLES,
        DIMENSIONS
      )
    ).toEqual({ id: "7", color: "#f97316", label: "Physical — Morning run" })
  })

  it("is null until a goal is chosen, which is what disables Save", () => {
    expect(getLinkMeta({ ...base, linkType: "role-goal", selectedRoleId: "11" }, ROLES, DIMENSIONS)).toBeNull()
    expect(getLinkMeta({ ...base, linkType: "role-goal" }, ROLES, DIMENSIONS)).toBeNull()
  })

  it("is null until an activity is chosen", () => {
    expect(
      getLinkMeta({ ...base, linkType: "sharpen-the-saw", selectedDimensionId: "physical" }, ROLES, DIMENSIONS)
    ).toBeNull()
  })

  it("is null when the goal does not belong to the selected role", () => {
    expect(
      getLinkMeta({ ...base, linkType: "role-goal", selectedRoleId: "12", selectedGoalId: "1" }, ROLES, DIMENSIONS)
    ).toBeNull()
  })

  it("is null for an activity that was not committed to this week", () => {
    expect(
      getLinkMeta(
        { ...base, linkType: "sharpen-the-saw", selectedDimensionId: "mental", selectedActivityId: "7" },
        ROLES,
        DIMENSIONS
      )
    ).toBeNull()
  })
})

describe("fromApiTask", () => {
  it("keeps the server's task_id, so an edit updates the row instead of replacing it", () => {
    const task = fromApiTask(apiTask({ is_completed: true }), ROLES, DIMENSIONS)
    expect(task.taskId).toBe(99)
    expect(task.isCompleted).toBe(true)
  })

  it("resolves a goal link to its role's colour and label", () => {
    const task = fromApiTask(apiTask(), ROLES, DIMENSIONS)
    expect(task).toMatchObject({
      linkType: "role-goal",
      linkId: "1",
      linkLabel: "Professional — Ship the report",
      color: "#B13BFF",
      startMins: 9 * 60,
      endMins: 10 * 60 + 30,
    })
  })

  it("reads a saved task's colour back off its goal's priority, not its role", () => {
    expect(fromApiTask(apiTask({ goal_id: 3 }), ROLES, DIMENSIONS).color).toBe("#FFCC00")
    expect(fromApiTask(apiTask({ goal_id: 1 }), ROLES, DIMENSIONS).color).toBe("#B13BFF")
  })

  it("resolves an activity link to its dimension", () => {
    const task = fromApiTask(
      apiTask({ goal_id: null, sharpen_the_saw_activity_id: 7 }),
      ROLES,
      DIMENSIONS
    )
    expect(task).toMatchObject({ linkType: "sharpen-the-saw", linkId: "7", linkLabel: "Physical — Morning run" })
  })

  // Dropping it client-side would delete it on the next save, which is the one thing this flow
  // must never do.
  it("keeps a task whose goal is no longer in the week rather than discarding it", () => {
    const task = fromApiTask(apiTask({ goal_id: 404 }), ROLES, DIMENSIONS)
    expect(task.linkId).toBe("404")
    expect(task.linkLabel).toBe("No longer available")
  })

  /* Blue is the fixed-appointment colour, and an orphaned task is the opposite of one: it is the
     block on the grid the user most needs to be able to fix. */
  it("draws a task whose link is gone in the unlinked grey, not the fixed-appointment blue", () => {
    expect(fromApiTask(apiTask({ goal_id: 404 }), ROLES, DIMENSIONS).color).toBe("#94a3b8")
  })
})

/**
 * What the calendar's legend is built from. It names the week's real roles and dimensions rather
 * than claiming every task is one purple — a claim that stopped being true the moment a card took
 * the colour of the role behind it, and that the legend went on making anyway.
 */
describe("taskCategories", () => {
  const task = (over: Partial<Task>): Task => ({
    id: "t", title: "x", dayIndex: 0, startMins: 540, endMins: 600,
    color: "#B13BFF", linkType: "role-goal", linkId: "1", linkLabel: "",
    isDailyPriority: false, isCompleted: false,
    ...over,
  })

  it("reports one entry per drawn block, for the legend to fold", () => {
    const categories = taskCategories(
      [ task({ id: "a", linkId: "1" }), task({ id: "b", linkId: "3" }), task({ id: "c", linkId: "2" }) ],
      [],
      ROLES,
      DIMENSIONS
    )
    expect(categories).toEqual([
      { kind: "goal", label: "Professional", color: "#B13BFF" },
      { kind: "goal", label: "Professional", color: "#B13BFF" },
      { kind: "goal", label: "Health", color: "#14b8a6" },
    ])
  })

  /* Goal 3 is a weekly priority, so its card is drawn in the reserved yellow. The legend still has
     to file it under "Professional": naming a row "yellow" would lose the role it belongs to, and
     the yellow already has a row of its own. */
  it("files a weekly-priority task under its role, not under the reserved yellow", () => {
    const [category] = taskCategories([ task({ linkId: "3", color: "#FFCC00" }) ], [], ROLES, DIMENSIONS)
    expect(category).toEqual({ kind: "goal", label: "Professional", color: "#B13BFF" })
  })

  it("names a Sharpen the Saw task by its dimension", () => {
    const [category] = taskCategories(
      [ task({ linkType: "sharpen-the-saw", linkId: "7" }) ], [], ROLES, DIMENSIONS
    )
    expect(category).toEqual({ kind: "activity", label: "Physical", color: "#f97316" })
  })

  it("reports a task whose link is gone rather than dropping it from the legend", () => {
    const [category] = taskCategories([ task({ linkId: "404" }) ], [], ROLES, DIMENSIONS)
    expect(category).toEqual({ kind: "none", label: "No longer available", color: "#94a3b8" })
  })

  /* One entry however many appointments there are: they are one category, not one each. And none
     at all on a week with no appointments, so the legend never explains an absent swatch. */
  it("adds a single fixed-appointment entry, and only when the week has one", () => {
    const appt: Appt = { id: "a", title: "Standup", dayIndex: 0, startMins: 540, endMins: 570, isCompleted: false }
    expect(taskCategories([], [ appt, { ...appt, id: "b" } ], ROLES, DIMENSIONS))
      .toEqual([ { kind: "fixed", label: "Fixed appointments", color: "#3b82f6" } ])
    expect(taskCategories([], [], ROLES, DIMENSIONS)).toEqual([])
  })
})

describe("hasWeeklyPriority", () => {
  const task = (color: string): Task => ({
    id: "t", title: "x", dayIndex: 0, startMins: 540, endMins: 600, color,
    linkType: "role-goal", linkId: "1", linkLabel: "", isDailyPriority: false, isCompleted: false,
  })

  it("is true only when some card on the grid is drawn in the reserved yellow", () => {
    expect(hasWeeklyPriority([ task("#B13BFF"), task("#FFCC00") ])).toBe(true)
    expect(hasWeeklyPriority([ task("#B13BFF") ])).toBe(false)
    expect(hasWeeklyPriority([])).toBe(false)
  })
})

describe("toTasksPayload", () => {
  const task = (over: Partial<Task> = {}): Task => ({
    id: "a",
    title: "Deep work",
    dayIndex: 2,
    startMins: 9 * 60,
    endMins: 10 * 60,
    color: "#B13BFF",
    linkType: "role-goal",
    linkId: "1",
    linkLabel: "Professional — Ship the report",
    isDailyPriority: false,
    isCompleted: false,
    ...over,
  })

  it("sends task_id for a task the server already holds", () => {
    expect(toTasksPayload([task({ taskId: 99 })])[0]).toMatchObject({ task_id: 99, goal_id: "1" })
  })

  it("omits task_id entirely for one added in this session", () => {
    expect(toTasksPayload([task()])[0]).not.toHaveProperty("task_id")
  })

  it("puts the link id in the field its type calls for", () => {
    const [goalLinked] = toTasksPayload([task()])
    expect(goalLinked.goal_id).toBe("1")
    expect(goalLinked.sharpen_the_saw_activity_id).toBeNull()

    const [activityLinked] = toTasksPayload([task({ linkType: "sharpen-the-saw", linkId: "7" })])
    expect(activityLinked.goal_id).toBeNull()
    expect(activityLinked.sharpen_the_saw_activity_id).toBe("7")
  })
})

describe("findLinkSelection", () => {
  const task = fromApiTask(apiTask(), ROLES, DIMENSIONS)

  it("preselects the role and goal an existing task serves", () => {
    expect(findLinkSelection(task, ROLES, DIMENSIONS)).toEqual({
      selectedRoleId: "11",
      selectedGoalId: "1",
      selectedDimensionId: "",
      selectedActivityId: "",
    })
  })

  it("selects nothing when the link no longer resolves", () => {
    const orphan = fromApiTask(apiTask({ goal_id: 404 }), ROLES, DIMENSIONS)
    expect(findLinkSelection(orphan, ROLES, DIMENSIONS)).toEqual({
      selectedRoleId: "",
      selectedGoalId: "",
      selectedDimensionId: "",
      selectedActivityId: "",
    })
  })
})

// What /weekly-plan/edit shows its Save bar on. It has to be false for a week nobody has touched
// -- the bar would otherwise be up the moment the page loads -- and true for the edit that page
// exists to make: dragging a task off the day it was missed on.
describe("isScheduleDirty", () => {
  const task = (over: Partial<Task> = {}): Task => ({
    id: "99",
    taskId: 99,
    title: "Deep work",
    dayIndex: 1,
    startMins: 9 * 60,
    endMins: 10 * 60,
    color: "#B13BFF",
    linkType: "role-goal",
    linkId: "1",
    linkLabel: "Professional — Ship the report",
    isDailyPriority: false,
    isCompleted: false,
    ...over,
  })

  const appt = (over: Partial<Appt> = {}): Appt => ({
    id: "12",
    taskId: 12,
    title: "Team standup",
    dayIndex: 0,
    startMins: 9 * 60,
    endMins: 9 * 60 + 30,
    isCompleted: false,
    ...over,
  })

  const week = { appts: [appt()], tasks: [task()] }

  it("is false for a week that has only been loaded", () => {
    expect(isScheduleDirty(week, { appts: [appt()], tasks: [task()] })).toBe(false)
  })

  it("is true once a task moves to another day", () => {
    expect(isScheduleDirty({ ...week, tasks: [task({ dayIndex: 3 })] }, week)).toBe(true)
  })

  it("is true for an appointment added in this session", () => {
    const added = { ...week, appts: [...week.appts, appt({ id: "new", taskId: undefined })] }
    expect(isScheduleDirty(added, week)).toBe(true)
  })

  it("is true once something is deleted", () => {
    expect(isScheduleDirty({ ...week, tasks: [] }, week)).toBe(true)
  })

  // Completion is /dashboard's to write, and this page never sends it. A week whose only
  // difference is a task ticked off elsewhere has nothing here to save.
  it("ignores a change to completion, which this page does not save", () => {
    expect(isScheduleDirty({ ...week, tasks: [task({ isCompleted: true })] }, week)).toBe(false)
  })

  // The client-side uuid is a React key, regenerated on every add. If it counted, an edit that
  // put a card back exactly where it started would still read as unsaved.
  it("ignores the client-only id", () => {
    expect(isScheduleDirty({ ...week, tasks: [task({ id: "different-uuid" })] }, week)).toBe(false)
  })
})
