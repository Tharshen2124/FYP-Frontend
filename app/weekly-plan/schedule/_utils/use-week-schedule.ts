"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { getColor } from "@/lib/role-colors"
import { toPlanDimensions } from "../../_utils/dimensions"
import type { PlanDimension, PlanRole } from "../../_types"
import { COLORS } from "../_constants/calendar"
import type { Appt, Task } from "../_types"
import { fromApiAppointment, fromApiTask, toAppointmentsPayload, toTasksPayload } from "./tasks"

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
  reload: () => void
  save: () => Promise<boolean>
}

/**
 * Everything `/weekly-plan/schedule` reads and writes, kept out of `page.tsx` the way `/roles`
 * keeps its lifecycle in `_utils/use-roles.ts`.
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

      setRoles(planRoles)
      setDimensions(planDimensions)
      // Appointments have no link to take a colour from, so they cycle the palette by position —
      // stable across reloads because the server returns them in a fixed order.
      setAppts(apptsRes.appointments.map((a, i) => fromApiAppointment(a, COLORS[i % COLORS.length])))
      setTasks(tasksRes.tasks.map(t => fromApiTask(t, planRoles, planDimensions)))
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

      setAppts(savedAppts.appointments.map((a, i) => fromApiAppointment(a, COLORS[i % COLORS.length])))
      setTasks(savedTasks.tasks.map(t => fromApiTask(t, roles, dimensions)))
      return true
    } catch {
      toast.error("Couldn't save your weekly schedule — please try again.")
      return false
    } finally {
      setIsSaving(false)
    }
  }, [appts, tasks, roles, dimensions, weekStart])

  return {
    appts, setAppts, tasks, setTasks, roles, dimensions,
    isLoading, loadError, isSaving, reload, save,
  }
}
