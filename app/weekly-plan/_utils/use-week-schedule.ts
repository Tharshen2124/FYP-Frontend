"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { getColor } from "@/lib/role-colors"
import { toPlanDimensions } from "./dimensions"
import type { PlanDimension, PlanRole } from "../_types"
import type { Appt, Task } from "../_types/calendar"
import { fromApiAppointment, fromApiTask, isScheduleDirty, toAppointmentsPayload, toTasksPayload } from "./tasks"

export interface WeekSchedule {
  appts: Appt[]
  setAppts: React.Dispatch<React.SetStateAction<Appt[]>>
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  roles: PlanRole[]
  dimensions: PlanDimension[]
  isLoading: boolean
  loadError: boolean
  isSaving: boolean
  /** Whether saving now would write anything. `/weekly-plan/edit` shows its Save bar on this. */
  isDirty: boolean
  /** Puts the calendar back to the week as the server last confirmed it. */
  discard: () => void
  reload: () => void
  save: () => Promise<boolean>
}

/**
 * Everything a week's calendar reads and writes, kept out of `page.tsx` the way `/roles` keeps its
 * lifecycle in `_utils/use-roles.ts`. Both routes that draw one use it: `/weekly-plan/schedule`
 * saves on the wizard's Next, `/weekly-plan/edit` on its own Save bar, and the requests either way
 * are the same.
 *
 * Five things are needed to draw the week: its appointments and tasks, the roles holding this
 * week's goals, the standing activity library, and which of those activities the previous step
 * committed to. The link picker offers only the committed ones — otherwise choosing them would
 * have been decoration.
 */
export function useWeekSchedule(weekStart: string): WeekSchedule {
  const [appts, setAppts] = useState<Appt[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [roles, setRoles] = useState<PlanRole[]>([])
  const [dimensions, setDimensions] = useState<PlanDimension[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  /**
   * The week as the server last confirmed it, which is what "unsaved changes" is measured against.
   * Kept beside the live state rather than derived from it: after a save the response *is* the new
   * baseline, so the two are set from the same object and cannot drift apart.
   */
  const [saved, setSaved] = useState<{ appts: Appt[]; tasks: Task[] }>({ appts: [], tasks: [] })

  const load = useCallback(async (week: string) => {
    setIsLoading(true)
    setLoadError(false)

    try {
      const [apptsRes, rolesRes, libraryRes, committedRes, tasksRes] = await Promise.all([
        api.fetchPlanAppointments(week),
        api.fetchStandingRoles(week),
        api.fetchSharpenTheSawActivities(),
        api.fetchWeekActivities(week),
        api.fetchPlanTasks(week),
      ])

      const planRoles: PlanRole[] = rolesRes.roles.map(r => ({
        id: String(r.role_id),
        name: r.name,
        color: getColor(r.color_id ?? "primary"),
        goals: r.goals.map(g => ({ id: String(g.goal_id), text: g.text })),
      }))

      const committed = new Set(committedRes.activity_ids.map(String))
      const planDimensions = toPlanDimensions(libraryRes.activities, committed)

      const loadedAppts = apptsRes.appointments.map(fromApiAppointment)
      const loadedTasks = tasksRes.tasks.map(t => fromApiTask(t, planRoles, planDimensions))

      setRoles(planRoles)
      setDimensions(planDimensions)
      setAppts(loadedAppts)
      setTasks(loadedTasks)
      setSaved({ appts: loadedAppts, tasks: loadedTasks })
    } catch {
      setLoadError(true)
      toast.error("Couldn't load your weekly schedule — please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (weekStart) load(weekStart)
  }, [weekStart, reloadKey, load])

  const reload = useCallback(() => setReloadKey(k => k + 1), [])

  /**
   * Appointments go first: a task may sit against one in the calendar, and saving them in the
   * other order would briefly leave the week describing a schedule it no longer has.
   *
   * Both responses are the week as it really stands afterwards, including anything the server
   * refused to delete, so local state is replaced from them rather than assumed.
   */
  const save = useCallback(async () => {
    setIsSaving(true)
    try {
      const savedAppts = await api.savePlanAppointments(toAppointmentsPayload(appts), weekStart)
      const savedTasks = await api.savePlanTasks(toTasksPayload(tasks), weekStart)

      const nextAppts = savedAppts.appointments.map(fromApiAppointment)
      const nextTasks = savedTasks.tasks.map(t => fromApiTask(t, roles, dimensions))

      setAppts(nextAppts)
      setTasks(nextTasks)
      setSaved({ appts: nextAppts, tasks: nextTasks })
      return true
    } catch {
      toast.error("Couldn't save your weekly schedule — please try again.")
      return false
    } finally {
      setIsSaving(false)
    }
  }, [appts, tasks, roles, dimensions, weekStart])

  const isDirty = useMemo(
    () => isScheduleDirty({ appts, tasks }, saved),
    [appts, tasks, saved]
  )

  const discard = useCallback(() => {
    setAppts(saved.appts)
    setTasks(saved.tasks)
  }, [saved])

  return {
    appts, setAppts, tasks, setTasks, roles, dimensions,
    isLoading, loadError, isSaving, isDirty, discard, reload, save,
  }
}
