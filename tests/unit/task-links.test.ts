import { describe, it, expect } from "vitest"
import {
  findLinkSelection,
  fromApiTask,
  getLinkMeta,
  toTasksPayload,
} from "@/app/weekly-plan/schedule/_utils/tasks"
import type { PlanDimension, PlanRole } from "@/app/weekly-plan/_types"
import type { Task } from "@/app/weekly-plan/schedule/_types"
import type { ApiPlanTask } from "@/lib/api"

// Stand-ins for what the API returns for the week being planned: roles carry the goals they hold
// in that week, dimensions carry only the activities committed to it.
const ROLES: PlanRole[] = [
  { id: "11", name: "Professional", color: "#B13BFF", goals: [{ id: "1", text: "Ship the report" }] },
  { id: "12", name: "Health", color: "#14b8a6", goals: [{ id: "2", text: "Run 5km" }] },
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
