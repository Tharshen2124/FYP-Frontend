import { localWeekStartParam } from "@/lib/date"
import { useAuthStore } from "@/stores/auth-store"

const API_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * The browser's IANA zone, sent on every request.
 *
 * A Google Calendar event needs one — an RFC3339 time without an offset is rejected unless a zone
 * travels beside it — and the server deliberately stores none, for the same reason it never
 * derives "the current week" itself. So the client supplies it per request, exactly as it supplies
 * `week_start`. A header rather than a body field because the endpoints that need it are about
 * tasks, goals and roles: the zone is request metadata like the bearer token, not part of what is
 * being saved.
 *
 * Falls back to UTC on the server render and in the rare browser with no Intl — the backend skips
 * the sync rather than filing a week at the wrong hour, which is the failure worth having.
 */
function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Time-Zone": timeZone(),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      body.error ?? body.errors?.join(", ") ?? `Request failed (${res.status})`
    )
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

/**
 * Every week-scoped endpoint identifies its weekly plan by the local Monday of the week in
 * question. The server validates that the date is a Monday and creates the plan on first write,
 * so several steps of one flow all land in the same plan.
 *
 * The default is the current week, which is all onboarding ever needs — it plans the week the user
 * signed up in and nothing else. `/weekly-plan/*` is the flow that does need a choice: it plans
 * the week ahead, or the current one for someone coming back after a gap, so it passes its target
 * week explicitly.
 */
function withWeekStart<T extends object>(data: T, weekStart: string = localWeekStartParam()) {
  return { ...data, week_start: weekStart }
}

function weekScoped(path: string, weekStart: string = localWeekStartParam()) {
  return `${path}?week_start=${weekStart}`
}

/**
 * Roles are standing; goals belong to exactly one week. A role carried into a new week comes back
 * with an empty `goals` array, so these shapes are always read against a particular `week_start`.
 */
/**
 * Which parts of a week reach Google Calendar, stored as *exclusions*.
 *
 * Keyed by `role_id` rather than by name so a rename keeps its setting, and recorded as what the
 * user switched *off* so a role created later exports by default — an inclusion list would leave
 * every new role silently absent from the calendar with nothing on screen to explain it.
 */
export interface ApiExportPreference {
  fixed_appointments: boolean
  excluded_dimensions: string[]
  excluded_role_ids: number[]
}

export interface ApiCalendarSettings {
  connected: boolean
  sync_enabled: boolean
  export_preference: ApiExportPreference
  synced_at: string | null
}

/** Whether a night's check-in was saved or dismissed. */
export type CheckInStatus = "completed" | "skipped"

/**
 * One night's End-of-Day check-in. Like a reflection it is addressed by (week, day) rather than
 * held by reference — a week has exactly one slot per night.
 *
 * This used to be a `localStorage` stamp, which made "have I already checked in tonight?" a
 * per-browser fact: checking in on a laptop left the phone still prompting.
 */
export interface ApiCheckIn {
  day_of_week: number
  status: CheckInStatus
}

/**
 * One evening's entry. `day_of_week` is 0 = Monday … 6 = Sunday, the same indexing as
 * `tasks.day_of_week` and `getWeekDays()` in lib/date.ts, so `getWeekDays(week)[day_of_week]` is
 * the date it was written for. There is no id: a week has exactly one slot per day, so a
 * reflection is addressed by (week, day) rather than held by reference.
 */
export interface ApiEveningReflection {
  day_of_week: number
  content: string
  updated_at: string
}

/** Written once per week and never regenerated, which is why it records the model that wrote it. */
export interface ApiWeeklySummary {
  content: string
  model: string
  generated_at: string
}

/**
 * One row of the week strip: counts, never text. The detail panel fetches a week at a time, so
 * shipping every week's prose just to label a list of dates would be the whole journal on load.
 */
export interface ApiReflectionWeek {
  week_start: string
  reflection_count: number
  has_summary: boolean
}

export interface ApiRoleGoal {
  goal_id: number
  text: string
  is_weekly_priority: boolean
  is_completed: boolean
}

export interface ApiRole {
  role_id: number
  name: string
  icon_id: string | null
  color_id: string | null
  goals: ApiRoleGoal[]
}

export interface ApiArchivedRole {
  role_id: number
  name: string
  icon_id: string | null
  color_id: string | null
  deleted_at: string
}

/** What archiving would cost, so the confirmation dialog can state real numbers. */
export interface ApiArchivePreview {
  goals: number
  incomplete_tasks: number
  completed_tasks: number
}

export interface ApiCarryForwardCandidate extends ApiRoleGoal {
  role_id: number
  role_name: string
}

/** One fixed appointment as the weekly-plan flow reads it back. */
export interface ApiPlanAppointment {
  task_id: number
  title: string
  description: string | null
  day_of_week: number
  start_time: string
  end_time: string
  is_completed: boolean
}

/** One scheduled task as the weekly-plan flow reads it back. */
export interface ApiPlanTask {
  task_id: number
  title: string
  day_of_week: number
  start_time: string
  end_time: string
  goal_id: number | null
  sharpen_the_saw_activity_id: number | null
  is_daily_priority: boolean
  is_completed: boolean
}

/**
 * One row of the history week strip: counts, never content. The detail panel fetches a week at a
 * time, so shipping every week's goals just to label a list of dates would be the whole history on
 * load — the same reasoning as `ApiReflectionWeek`.
 */
/**
 * One planned week's analytics, counts only — the four cards turn them into percentages
 * themselves, the same division of labour as `ApiHistoryGoal`: a ratio is cheap to compute, and a
 * client that owns it can re-slice a range without another round trip.
 *
 * `dimensions` and `daily_priorities` carry only the rows that exist. The four fixed dimensions
 * and the seven days live on the client, so it fills the gaps rather than the server shipping
 * zeroes for them.
 */
export interface ApiAnalyticsWeek {
  week_start: string
  end_date: string
  /** `dimension` is the raw stored id ("physical", "social", …); the palette is the client's. */
  dimensions: { dimension: string; completed: number; total: number }[]
  /** Tasks resolved through `task -> goal -> role`. A since-archived role still appears here. */
  roles: { role_id: number; name: string; color_id: string | null; completed: number; total: number }[]
  daily_priorities: { day_of_week: number; completed: number; total: number }[]
  /** Active goals only, so a dropped goal cannot sit in the denominator; it is reported beside it. */
  goals: { achieved: number; total: number; dropped: number }
}

export interface ApiHistoryWeekMeta {
  week_start: string
  goal_count: number
  goals_achieved: number
  task_count: number
  tasks_completed: number
  activity_count: number
}

/** The role a past week's goal belonged to. `is_archived` is why /roles could not have served this:
 *  that endpoint returns only active roles, and archived ones come back with no goals at all. */
export interface ApiHistoryRole {
  role_id: number
  name: string
  color_id: string | null
  icon_id: string | null
  is_archived: boolean
}

/** `is_achieved` and `is_dropped` rather than a finished `outcome`: whether the week has ended is
 *  a client fact, so the server sends the parts and the client composes the outcome. */
export interface ApiHistoryGoal {
  goal_id: number
  text: string
  is_weekly_priority: boolean
  /** Whether every task under this goal was done — read off the tasks by `Goal.achieved`, not off
   *  the vestigial `goals.is_completed` column, which never had a writer. */
  is_achieved: boolean
  is_dropped: boolean
  /** 1-based position in this goal's carry-forward chain: 1 for one begun in this week, 3 for one
   *  carried in twice. Goals are week-owned copies, so this is a walk of `goal_carryovers`. */
  week_index: number
  /** Whether it continued into a later week — the difference between abandoned and still going. */
  is_carried_forward: boolean
  role: ApiHistoryRole
}

export interface ApiHistoryActivity {
  sharpen_the_saw_activity_id: number
  dimension: string
  activity_description: string
  is_deleted: boolean
}

/** `ApiTask` as /weekly-plans returns it, plus `role_color_id` so the schedule can tint a chip in
 *  its role's colour without a second request. */
export interface ApiHistoryTask {
  task_id: number
  title: string
  description: string | null
  day_of_week: number
  start_time: string
  end_time: string
  is_fixed_appointment: boolean
  is_daily_priority: boolean
  /** The goal's flag, not the task's — false for anything that does not serve a goal. */
  is_weekly_priority: boolean
  is_completed: boolean
  link_kind: "goal" | "activity" | null
  link_text: string | null
  role_name: string | null
  role_color_id: string | null
  dimension: string | null
}

export interface ApiHistoryWeek {
  week_start: string
  end_date: string
  goals: ApiHistoryGoal[]
  activities: ApiHistoryActivity[]
  tasks: ApiHistoryTask[]
}

export const api = {
  signup: (data: { email: string; username: string; password: string }) =>
    request<{ user: { email: string; username: string } }>("/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    request<{ token: string }>("/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  completeOnboarding: () =>
    request<{ user: { is_onboarded: boolean } }>("/users/complete_onboarding", {
      method: "PATCH",
    }),
  submitRoles: (data: {
    roles: { name: string; icon_id: string; goals: { text: string; is_weekly_priority: boolean }[] }[]
  }) =>
    request<{ roles: unknown[] }>("/onboarding/roles", {
      method: "POST",
      body: JSON.stringify(withWeekStart(data)),
    }),
  fetchRoles: (weekStart?: string) =>
    request<{
      roles: { role_id: number; name: string; icon_id: string; goals: { goal_id: number; text: string; is_weekly_priority: boolean }[] }[]
    }>(weekScoped("/onboarding/roles", weekStart)),
  submitSharpenTheSaw: (data: { activities: { dimension: string; activity_description: string }[] }) =>
    request<{ activities: unknown[] }>("/onboarding/sharpen-the-saw", {
      method: "POST",
      body: JSON.stringify(withWeekStart(data)),
    }),
  fetchSharpenTheSaw: (weekStart?: string) =>
    request<{ activities: { sharpen_the_saw_activity_id: number; dimension: string; activity_description: string }[] }>(
      weekScoped("/onboarding/sharpen-the-saw", weekStart)
    ),
  fetchSharpenTheSawActivities: () =>
    request<{ activities: { sharpen_the_saw_activity_id: number; dimension: string; activity_description: string }[] }>(
      "/sharpen-the-saw-activities"
    ),
  createSharpenTheSawActivity: (data: { dimension: string; activity_description: string }) =>
    request<{ activity: { sharpen_the_saw_activity_id: number; dimension: string; activity_description: string } }>(
      "/sharpen-the-saw-activities",
      { method: "POST", body: JSON.stringify(data) }
    ),
  /**
   * Renaming a standing activity. The `week_start` is not what is being edited — an activity is a
   * standing library entry, not a week's — it is there so the calendar sync knows which week to
   * start from: the activity's text is on the event of every task scheduled against it.
   */
  updateSharpenTheSawActivity: (id: number, data: { dimension?: string; activity_description?: string }) =>
    request<{ activity: { sharpen_the_saw_activity_id: number; dimension: string; activity_description: string } }>(
      weekScoped(`/sharpen-the-saw-activities/${id}`),
      { method: "PATCH", body: JSON.stringify(data) }
    ),
  deleteSharpenTheSawActivity: (id: number) =>
    request<void>(`/sharpen-the-saw-activities/${id}`, { method: "DELETE" }),
  submitFixedAppointments: (data: {
    appointments: { title: string; description: string; day_of_week: number; start_time: string; end_time: string }[]
  }) =>
    request<{ appointments: unknown[] }>("/onboarding/fixed-appointments", {
      method: "POST",
      body: JSON.stringify(withWeekStart(data)),
    }),
  fetchFixedAppointments: () =>
    request<{
      appointments: { task_id: number; title: string; description: string; day_of_week: number; start_time: string; end_time: string }[]
    }>(weekScoped("/onboarding/fixed-appointments")),
  submitScheduleTasks: (data: {
    tasks: {
      title: string
      day_of_week: number
      start_time: string
      end_time: string
      goal_id: string | null
      sharpen_the_saw_activity_id: string | null
      is_daily_priority: boolean
    }[]
  }) =>
    request<{ tasks: unknown[] }>("/onboarding/schedule-tasks", {
      method: "POST",
      body: JSON.stringify(withWeekStart(data)),
    }),
  fetchScheduleTasks: () =>
    request<{
      tasks: {
        task_id: number
        title: string
        day_of_week: number
        start_time: string
        end_time: string
        goal_id: number | null
        sharpen_the_saw_activity_id: number | null
        is_daily_priority: boolean
      }[]
    }>(weekScoped("/onboarding/schedule-tasks")),
  // --- standing roles & goals ---------------------------------------------------------------
  fetchStandingRoles: (weekStart?: string) =>
    request<{ roles: ApiRole[]; archived_roles: ApiArchivedRole[] }>(weekScoped("/roles", weekStart)),
  createRole: (data: { role_name: string; icon_id: string; color_id: string }) =>
    request<{ role: ApiRole }>("/roles", {
      method: "POST",
      body: JSON.stringify(withWeekStart(data)),
    }),
  updateRole: (id: number, data: { role_name?: string; icon_id?: string; color_id?: string }) =>
    request<{ role: ApiRole }>(`/roles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(withWeekStart(data)),
    }),
  fetchRoleArchivePreview: (id: number) =>
    request<{ preview: ApiArchivePreview }>(weekScoped(`/roles/${id}/archive-preview`)),
  /** Archives the role and this week's goals under it. Earlier weeks are left untouched. */
  archiveRole: (id: number) =>
    request<{ archived: ApiArchivePreview }>(weekScoped(`/roles/${id}`), { method: "DELETE" }),
  restoreRole: (id: number) =>
    request<{ role: ApiRole }>(weekScoped(`/roles/${id}/restore`), { method: "POST" }),
  createGoal: (data: { role_id: number; description: string; is_weekly_priority?: boolean }, weekStart?: string) =>
    request<{ goal: ApiRoleGoal }>("/goals", {
      method: "POST",
      body: JSON.stringify(withWeekStart(data, weekStart)),
    }),
  updateGoal: (id: number, data: { description?: string; is_weekly_priority?: boolean; is_completed?: boolean }) =>
    request<{ goal: ApiRoleGoal }>(`/goals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(withWeekStart(data)),
    }),
  archiveGoal: (id: number) =>
    request<{ archived: ApiArchivePreview }>(weekScoped(`/goals/${id}`), { method: "DELETE" }),
  /** Backs the Undo action on the remove-goal toast. Only valid within the goal's own week. */
  restoreGoal: (id: number) =>
    request<{ goal: ApiRoleGoal }>(weekScoped(`/goals/${id}/restore`), { method: "POST" }),
  fetchCarryForwardCandidates: (weekStart?: string) =>
    request<{ candidates: ApiCarryForwardCandidate[] }>(weekScoped("/goals/carry-forward-candidates", weekStart)),
  carryForwardGoals: (goalIds: number[], weekStart?: string) =>
    request<{ goals: ApiRoleGoal[] }>("/goals/carry-forward", {
      method: "POST",
      body: JSON.stringify(withWeekStart({ goal_ids: goalIds }, weekStart)),
    }),
  // --- the repeatable weekly-plan flow ---------------------------------------------------------
  //
  // Same controller actions as the `/onboarding/*` pair above, under paths that say what they are
  // for. Onboarding is walked once and never returned to; this flow runs every week, and it plans
  // whichever week it was pointed at rather than always the current one.
  //
  // `task_id` is what makes an edit an edit. Sending it back means the server updates that row in
  // place, so a task the user has already ticked off keeps its id and its completion; a task with
  // no id is new, and one the client stops sending was deleted.
  fetchPlanAppointments: (weekStart?: string) =>
    request<{ appointments: ApiPlanAppointment[] }>(
      weekScoped("/weekly-plans/fixed-appointments", weekStart)
    ),
  savePlanAppointments: (
    appointments: {
      task_id?: number
      title: string
      description: string
      day_of_week: number
      start_time: string
      end_time: string
    }[],
    weekStart?: string
  ) =>
    request<{ appointments: ApiPlanAppointment[] }>("/weekly-plans/fixed-appointments", {
      method: "POST",
      body: JSON.stringify(withWeekStart({ appointments }, weekStart)),
    }),
  fetchPlanTasks: (weekStart?: string) =>
    request<{ tasks: ApiPlanTask[] }>(weekScoped("/weekly-plans/tasks", weekStart)),
  savePlanTasks: (
    tasks: {
      task_id?: number
      title: string
      day_of_week: number
      start_time: string
      end_time: string
      goal_id: string | null
      sharpen_the_saw_activity_id: string | null
      is_daily_priority: boolean
    }[],
    weekStart?: string
  ) =>
    request<{ tasks: ApiPlanTask[] }>("/weekly-plans/tasks", {
      method: "POST",
      body: JSON.stringify(withWeekStart({ tasks }, weekStart)),
    }),
  /** Which Sharpen the Saw activities a week is committed to. An unplanned week is committed to none. */
  fetchWeekActivities: (weekStart?: string) =>
    request<{ activity_ids: number[] }>(weekScoped("/weekly-plans/sharpen-the-saw", weekStart)),
  /**
   * Replaces the week's committed set. An activity a task is already scheduled against stays
   * committed whether or not it is sent — the calendar is the stronger statement of the two.
   */
  saveWeekActivities: (activityIds: number[], weekStart?: string) =>
    request<{ activity_ids: number[] }>("/weekly-plans/sharpen-the-saw", {
      method: "PUT",
      body: JSON.stringify(withWeekStart({ activity_ids: activityIds }, weekStart)),
    }),
  /**
   * Read-only view of one week for the dashboard. `weekly_plan` is `null` when the user has not
   * planned this week — that is a normal answer, not an error, and looking does not create a plan.
   */
  fetchWeeklyPlan: (weekStart?: string) =>
    request<{
      weekly_plan: {
        weekly_plan_id: number
        start_date: string
        end_date: string
        tasks: {
          task_id: number
          title: string
          description: string | null
          day_of_week: number
          start_time: string
          end_time: string
          is_fixed_appointment: boolean
          is_daily_priority: boolean
          is_weekly_priority: boolean
          is_completed: boolean
          link_kind: "goal" | "activity" | null
          link_text: string | null
          role_name: string | null
          dimension: string | null
        }[]
        check_ins: ApiCheckIn[]
      } | null
      eod_time: string
    }>(weekScoped("/weekly-plans", weekStart)),
  /**
   * Records that a night's check-in was dealt with, and how. Upserted: a night dismissed at nine
   * and saved at eleven is one night, not two, and a night already saved is never downgraded to a
   * skip. 422 for a week that was never planned — a check-in hangs off a weekly plan.
   */
  saveCheckIn: (dayOfWeek: number, status: CheckInStatus, weekStart?: string) =>
    request<{ check_in: ApiCheckIn }>("/weekly-plans/check-in", {
      method: "PUT",
      body: JSON.stringify(withWeekStart({ day_of_week: dayOfWeek, status }, weekStart)),
    }),
  /**
   * When the End-of-Day check-in appears, as "HH:MM". `/settings` reads and writes it here; the
   * dashboard gets it on the weekly-plan response, so deciding whether to prompt costs it nothing.
   */
  fetchEodTime: () => request<{ eod_time: string }>("/users/eod-time"),
  updateEodTime: (eodTime: string) =>
    request<{ eod_time: string }>("/users/eod-time", {
      method: "PATCH",
      body: JSON.stringify({ eod_time: eodTime }),
    }),
  /**
   * One week's reflections and its summary in a single round trip. `planned` is false when the
   * user never planned that week — a normal answer, and looking does not create the plan.
   */
  fetchEveningReflections: (weekStart?: string) =>
    request<{
      planned: boolean
      reflections: ApiEveningReflection[]
      summary: ApiWeeklySummary | null
    }>(weekScoped("/weekly-plans/evening-reflections", weekStart)),
  /**
   * Writes one evening. Create and edit are the same call: there is exactly one slot per day, so
   * the client never has to know whether it already holds a row.
   *
   * Rejected with 422 for a week that was never planned — a reflection hangs off a weekly plan,
   * and writing one must not be what brings that plan into existence.
   */
  saveEveningReflection: (dayOfWeek: number, content: string, weekStart?: string) =>
    request<{ reflection: ApiEveningReflection }>("/weekly-plans/evening-reflections", {
      method: "PUT",
      body: JSON.stringify(withWeekStart({ day_of_week: dayOfWeek, content }, weekStart)),
    }),
  /**
   * The week strip, over a range of Mondays. Weeks the user never planned are simply absent, so
   * the caller fills the gaps itself rather than the server inventing rows.
   */
  fetchReflectionWeeks: (from: string, to: string) =>
    request<{ weeks: ApiReflectionWeek[] }>(`/evening-reflections/weeks?from=${from}&to=${to}`),
  /**
   * Generates the week's summary — once, and only ever once. 422 when the week is not fully
   * written or already has one, 429 when the upstream quota is spent, 502 when it is unreachable.
   * `request` surfaces the server's own sentence as the Error message, which is worth showing.
   */
  generateWeeklySummary: (weekStart?: string) =>
    request<{ summary: ApiWeeklySummary }>("/weekly-plans/weekly-summary", {
      method: "POST",
      body: JSON.stringify(withWeekStart({}, weekStart)),
    }),
  /**
   * Ticking one task off. Not week-scoped: the row names its own week, so asking the caller to
   * restate it would only create something to be wrong about.
   */
  setTaskCompletion: (taskId: number, isCompleted: boolean) =>
    request<{ task: { task_id: number; is_completed: boolean } }>(`/tasks/${taskId}/completion`, {
      method: "PATCH",
      body: JSON.stringify({ is_completed: isCompleted }),
    }),
  /**
   * One past week as it was recorded — including goals under a role since archived, goals since
   * dropped and activities since deleted. Every other read filters those out, because every other
   * read is a planning surface. `week` is `null` for a week the user never planned, and looking
   * creates nothing.
   */
  fetchHistoryWeek: (weekStart: string) =>
    request<{ week: ApiHistoryWeek | null }>(weekScoped("/history", weekStart)),
  /**
   * The history week strip, over a range of Mondays. Weeks the user never planned are simply
   * absent, so the caller fills the gaps itself rather than the server inventing rows.
   */
  fetchHistoryWeeks: (from: string, to: string) =>
    request<{ weeks: ApiHistoryWeekMeta[] }>(`/history/weeks?from=${from}&to=${to}`),
  /**
   * The figures behind /analytics, one row per planned week across a range. Weeks the user never
   * planned are absent, and the range is capped at 52 weeks server-side.
   */
  fetchAnalytics: (from: string, to: string) =>
    request<{ weeks: ApiAnalyticsWeek[] }>(`/analytics?from=${from}&to=${to}`),
  googleLoginHref: () => `${API_URL}/login`,
  /**
   * The Google Calendar connection and what it exports. `connected` means we hold a refresh token
   * and a calendar to write into — deliberately not "the access token is still valid", which
   * expires hourly and is renewed on demand.
   */
  fetchCalendarSettings: () => request<{ calendar: ApiCalendarSettings }>("/calendar"),
  /**
   * The consent screen's URL, not a redirect to it. A redirect would have to be followed by the
   * browser, and the browser cannot send the bearer token that says which account is connecting —
   * so this is a normal authenticated call and the caller navigates to what it returns. Unlike
   * `googleLoginHref`, which needs no token and so can be a bare string.
   */
  fetchCalendarConnectUrl: () => request<{ url: string }>("/calendar/connect"),
  updateCalendarSettings: (data: { sync_enabled: boolean; export_preference: ApiExportPreference }, weekStart?: string) =>
    request<{ calendar: ApiCalendarSettings }>("/calendar/settings", {
      method: "PATCH",
      body: JSON.stringify(withWeekStart(data, weekStart)),
    }),
  /**
   * The Sync button. Runs inline rather than in the background, because the point of a button is
   * being able to say what happened: 429 when Google is throttling, 502 when it is unreachable,
   * 422 when the grant has been revoked and the only fix is reconnecting.
   */
  syncCalendar: (weekStart?: string) =>
    request<{ weeks: number; written: number; deleted: number; calendar: ApiCalendarSettings }>(
      "/calendar/sync",
      { method: "POST", body: JSON.stringify(withWeekStart({}, weekStart)) }
    ),
  /** Deletes the HabitFlow calendar, taking its events with it, and revokes the grant. */
  disconnectCalendar: () => request<{ calendar: ApiCalendarSettings }>("/calendar", { method: "DELETE" }),
}
