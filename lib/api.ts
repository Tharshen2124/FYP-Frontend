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

/**
 * A failed request, carrying the status alongside the server's own sentence.
 *
 * The status matters for exactly one thing: **402 Payment Required** is how the API says "this is
 * a Premium feature", and a page that can tell it from a 422 renders an upgrade offer instead of a
 * red error line. Every other caller reads `.message` and is unaffected — an Error subclass still
 * is an Error, so nothing that already catches one has to change.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

/** The API's way of saying a feature belongs to the paid tier. */
export const PAYMENT_REQUIRED = 402

export function isPaymentRequired(error: unknown): boolean {
  return error instanceof ApiError && error.status === PAYMENT_REQUIRED
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
    throw new ApiError(
      body.error ?? body.errors?.join(", ") ?? `Request failed (${res.status})`,
      res.status
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
  /**
   * As stored, which for a free account is not the same as what happens: automatic sync is a paid
   * feature, and the server withholds it while leaving the preference the user set alone. Read
   * `premium` beside this to know which of the two the switch should show.
   */
  sync_enabled: boolean
  export_preference: ApiExportPreference
  synced_at: string | null
}

/**
 * `premium` sits beside the calendar rather than inside it: it is a fact about the account, not
 * about the calendar. Every calendar endpoint returns it, so a write cannot leave the page holding
 * a staler answer than the read that preceded it.
 */
export interface ApiCalendarResponse {
  calendar: ApiCalendarSettings
  premium: boolean
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

/**
 * The account's standing with Stripe, as `/subscription` reports it.
 *
 * `premium` is the server's answer rather than something derived here from `status`: a cancelled
 * subscription keeps the status "active" until its period actually ends, and that rule belongs in
 * one place. `manageable` is whether there is a Stripe customer for the Billing Portal to show —
 * an account that has never checked out has nothing to manage.
 */
export interface ApiSubscription {
  premium: boolean
  status: string | null
  period_end: string | null
  manageable: boolean
}

/**
 * What Premium costs, read from Stripe rather than held as a constant here, so the figure on the
 * pricing page cannot disagree with the figure on the card form. Null when Stripe could not be
 * reached — the page still knows which plan the user is on, so it renders without the price.
 */
export interface ApiPlan {
  amount_cents: number
  currency: string
  interval: string | null
}

/**
 * One page of a list, and enough to draw the pager without a second request. `total` describes the
 * whole filtered scope rather than the page, which is what lets the header say "1–25 of 340".
 *
 * The server clamps `page` to what exists, so asking for page 40 of 3 comes back as page 3 — the
 * pager can therefore trust `page` as the page it is looking at rather than the page it asked for.
 */
export interface ApiPagination {
  page: number
  per_page: number
  total: number
  total_pages: number
}

/** One row of the admin user list. Deliberately carries no credential of any kind. */
export interface ApiAdminUser {
  user_id: number
  username: string
  email: string
  created_at: string
  is_onboarded: boolean
  is_admin: boolean
  /** The server's own `User#premium?`, not a re-reading of the two columns beside it. */
  premium: boolean
  subscription_status: string | null
  subscription_period_end: string | null
  calendar_connected: boolean
  weekly_plans: number
  /** The newest week this account has planned, or null if it has planned none. */
  last_plan_week: string | null
  /** Lifetime paid, in the minor units of `currency`. Zero — with a null currency — if never paid. */
  paid_cents: number
  currency: string | null
}

export interface ApiAdminPayment {
  payment_id: number
  stripe_invoice_id: string
  amount_cents: number
  currency: string
  status: "paid" | "failed"
  /** Null on a failure: there is no moment at which it was paid. */
  paid_at: string | null
  created_at: string
  user: { user_id: number; username: string; email: string } | null
}

/**
 * Money, in **one currency at a time**.
 *
 * `payments.currency` is per row, so the server reports the currency with the largest paid total
 * and lists any others beside it rather than summing across them — a figure that has added MYR to
 * USD is not one anybody can act on. `currency` is null when nothing has been paid at all, which
 * is why `failed_count` sits outside that: a deployment whose every charge failed has no revenue
 * and very much has payments.
 */
export interface ApiAdminRevenue {
  currency: string | null
  total_cents: number
  recent_cents: number
  paid_count: number
  failed_count: number
  /** Thirteen continuous months ending this one, oldest first, as `YYYY-MM`. */
  monthly: { month: string; cents: number }[]
  other_currencies: { currency: string; total_cents: number }[]
}

export interface ApiAdminOverview {
  users: {
    total: number
    onboarded: number
    /** Accounts opened in the last 30 days. */
    new_recently: number
    /** Accounts that ticked off or rescheduled a task in the last 30 days. */
    active_recently: number
    admins: number
  }
  subscriptions: {
    premium: number
    /** Raw Stripe statuses, so `past_due` and `unpaid` show up without being anticipated here. */
    by_status: Record<string, number>
    ever_subscribed: number
  }
  revenue: ApiAdminRevenue
}

/**
 * The query string for the two paginated admin lists. Every value goes through
 * `URLSearchParams`, which escapes them — a search for "%" has to reach the server as a character
 * rather than as a broken percent-escape, and it is the exact term the server takes care to treat
 * as a character rather than a SQL wildcard.
 *
 * Empty and undefined values are dropped rather than sent blank, so the server sees no `q` at all
 * when the search box is empty and falls through to its unfiltered scope.
 */
function adminQuery(params: { page?: number; perPage?: number; query?: string; status?: string }) {
  const search = new URLSearchParams()
  if (params.page) search.set("page", String(params.page))
  if (params.perPage) search.set("per_page", String(params.perPage))
  if (params.query?.trim()) search.set("q", params.query.trim())
  if (params.status) search.set("status", params.status)
  return search.toString()
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
    appointments: { title: string; day_of_week: number; start_time: string; end_time: string }[]
  }) =>
    request<{ appointments: unknown[] }>("/onboarding/fixed-appointments", {
      method: "POST",
      body: JSON.stringify(withWeekStart(data)),
    }),
  fetchFixedAppointments: () =>
    request<{
      appointments: { task_id: number; title: string; day_of_week: number; start_time: string; end_time: string }[]
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
      /** Whether the AI summary is unlocked. Sent here so the button knows before it is pressed. */
      premium: boolean
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
    request<{ weeks: ApiHistoryWeekMeta[]; premium: boolean }>(
      `/history/weeks?from=${from}&to=${to}`
    ),
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
  fetchCalendarSettings: () => request<ApiCalendarResponse>("/calendar"),
  /**
   * The consent screen's URL, not a redirect to it. A redirect would have to be followed by the
   * browser, and the browser cannot send the bearer token that says which account is connecting —
   * so this is a normal authenticated call and the caller navigates to what it returns. Unlike
   * `googleLoginHref`, which needs no token and so can be a bare string.
   */
  fetchCalendarConnectUrl: () => request<{ url: string }>("/calendar/connect"),
  updateCalendarSettings: (data: { sync_enabled: boolean; export_preference: ApiExportPreference }, weekStart?: string) =>
    request<ApiCalendarResponse>("/calendar/settings", {
      method: "PATCH",
      body: JSON.stringify(withWeekStart(data, weekStart)),
    }),
  /**
   * The Sync button. Runs inline rather than in the background, because the point of a button is
   * being able to say what happened: 429 when Google is throttling, 502 when it is unreachable,
   * 422 when the grant has been revoked and the only fix is reconnecting.
   */
  syncCalendar: (weekStart?: string) =>
    request<{ weeks: number; written: number; deleted: number } & ApiCalendarResponse>(
      "/calendar/sync",
      { method: "POST", body: JSON.stringify(withWeekStart({}, weekStart)) }
    ),
  /** Deletes the HabitFlow calendar, taking its events with it, and revokes the grant. */
  disconnectCalendar: () => request<ApiCalendarResponse>("/calendar", { method: "DELETE" }),

  // --- subscription & billing ---
  /**
   * The account's plan, and what Premium costs. One call, because the pricing page needs both and
   * neither is worth its own round trip.
   */
  fetchSubscription: () => request<{ subscription: ApiSubscription; plan: ApiPlan | null }>("/subscription"),
  /**
   * Stripe Checkout's URL, not a redirect to it — the same shape as `fetchCalendarConnectUrl` and
   * for the same reason: a redirect would have to be followed by the browser, and the browser
   * cannot send the bearer token that says whose subscription is being started. The caller
   * navigates to what this returns.
   */
  createCheckoutSession: () => request<{ url: string }>("/subscription/checkout", { method: "POST" }),
  /** The Billing Portal's URL. Stripe hosts cancel, resume, card changes and invoice history. */
  createPortalSession: () => request<{ url: string }>("/subscription/portal", { method: "POST" }),
  /**
   * Applies the checkout the user has just come back from, so the page reads Premium immediately
   * rather than waiting on the webhook. The webhook is still what this app believes — this writes
   * the same state through the same code, so the two cannot disagree.
   */
  confirmCheckout: (sessionId: string) =>
    request<{ subscription: ApiSubscription }>("/subscription/confirm", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    }),

  // --- admin ---
  /**
   * The metric cards. One request, made once — nothing on it is paginated, and the four cards
   * would otherwise be four round trips over the same three tables.
   */
  fetchAdminOverview: () => request<ApiAdminOverview>("/admin/overview"),
  /**
   * One page of accounts, newest first. Paginated on the **server** rather than fetched whole and
   * sliced in the browser, which is what `/analytics` does — the difference is that a week of
   * counts has a ceiling and "every account that ever signed up" does not.
   *
   * `query` is encoded rather than interpolated: "%" is a valid thing to type into a search box and
   * an invalid escape in a URL.
   */
  fetchAdminUsers: (params: { page?: number; perPage?: number; query?: string } = {}) =>
    request<{ users: ApiAdminUser[]; pagination: ApiPagination }>(
      `/admin/users?${adminQuery(params)}`
    ),
  /** One page of invoices, newest first, optionally narrowed to a status. */
  fetchAdminPayments: (params: { page?: number; perPage?: number; status?: "paid" | "failed" } = {}) =>
    request<{ payments: ApiAdminPayment[]; pagination: ApiPagination }>(
      `/admin/payments?${adminQuery(params)}`
    ),
}
