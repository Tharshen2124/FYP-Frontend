"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { getColor } from "@/lib/role-colors"
import { strToMins } from "./time"
import { fromApiTask, toScheduleTasksPayload } from "./tasks"
import type { ApiActivity, ApiRole, FixedAppt, Task } from "../_types"

export interface ScheduleTasksData {
  fixedAppts: FixedAppt[]
  roles: ApiRole[]
  activitiesByDimension: Record<string, ApiActivity[]>
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  isLoading: boolean
  loadError: boolean
  isSubmitting: boolean
  reload: () => void
  submit: () => Promise<boolean>
}

/**
 * Everything onboarding step 4 reads and writes, kept out of `page.tsx` the way
 * `/weekly-plan/schedule` keeps its lifecycle in `_utils/use-week-schedule.ts`.
 *
 * Four things are needed to draw the week: the fixed appointments laid down in step 3, the roles
 * holding this week's goals, the Sharpen the Saw activities from step 2, and any tasks a previous
 * visit already saved. Roles and activities are mapped before the tasks that reference them,
 * since `fromApiTask` resolves a task's link label out of both.
 */
export function useScheduleTasks(): ScheduleTasksData {
  const [fixedAppts, setFixedAppts] = useState<FixedAppt[]>([])
  const [roles, setRoles] = useState<ApiRole[]>([])
  const [activitiesByDimension, setActivitiesByDimension] = useState<Record<string, ApiActivity[]>>({})
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoadError(false)
    try {
      const [apptsRes, rolesRes, activitiesRes, tasksRes] = await Promise.all([
        api.fetchFixedAppointments(),
        api.fetchRoles(),
        api.fetchSharpenTheSaw(),
        api.fetchScheduleTasks(),
      ])

      const mappedRoles: ApiRole[] = rolesRes.roles.map(r => ({
        id: String(r.role_id),
        name: r.name,
        color: getColor(r.color_id ?? ""),
        goals: r.goals.map(g => ({
          id: String(g.goal_id),
          text: g.text,
          isWeeklyPriority: g.is_weekly_priority,
        })),
      }))

      const mappedActivitiesByDimension: Record<string, ApiActivity[]> = {}
      for (const a of activitiesRes.activities) {
        const activity: ApiActivity = { id: String(a.sharpen_the_saw_activity_id), text: a.activity_description, dimension: a.dimension }
        const bucket = mappedActivitiesByDimension[a.dimension] ?? []
        bucket.push(activity)
        mappedActivitiesByDimension[a.dimension] = bucket
      }

      const mappedFixed: FixedAppt[] = apptsRes.appointments.map(a => ({
        id: String(a.task_id),
        title: a.title,
        dayIndex: a.day_of_week,
        startMins: strToMins(a.start_time),
        endMins: strToMins(a.end_time),
      }))

      setFixedAppts(mappedFixed)
      setRoles(mappedRoles)
      setActivitiesByDimension(mappedActivitiesByDimension)
      setTasks(tasksRes.tasks.map(t => fromApiTask(t, mappedRoles, mappedActivitiesByDimension)))
    } catch {
      toast.error("Couldn't load your onboarding data — please try again.")
      setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /**
   * Resolves to whether the week saved. `isSubmitting` is deliberately left set on success: the
   * caller navigates away next, and clearing it would flash the Next button back to enabled on a
   * page that is already leaving.
   */
  const submit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await api.submitScheduleTasks(toScheduleTasksPayload(tasks))
      return true
    } catch {
      toast.error("Couldn't save your tasks — please try again.")
      setIsSubmitting(false)
      return false
    }
  }, [tasks])

  return {
    fixedAppts, roles, activitiesByDimension, tasks, setTasks,
    isLoading, loadError, isSubmitting, reload: load, submit,
  }
}
