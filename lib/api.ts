import { localWeekStartParam } from "@/lib/date"
import { useAuthStore } from "@/stores/auth-store"

const API_URL = process.env.NEXT_PUBLIC_API_URL

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
 * Every onboarding endpoint is scoped to a weekly plan, which the client identifies by the local
 * Monday of the week it is planning. The server validates that the date is a Monday and creates
 * the plan on first use, so the four steps all land in the same one.
 *
 * Threaded in here rather than at the call sites: no onboarding step has a reason to plan a week
 * other than the current one.
 */
function withWeekStart<T extends object>(data: T) {
  return { ...data, week_start: localWeekStartParam() }
}

function weekScoped(path: string) {
  return `${path}?week_start=${localWeekStartParam()}`
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
  fetchRoles: () =>
    request<{
      roles: { role_id: number; name: string; icon_id: string; goals: { goal_id: number; text: string; is_weekly_priority: boolean }[] }[]
    }>(weekScoped("/onboarding/roles")),
  submitSharpenTheSaw: (data: { activities: { dimension: string; activity_description: string }[] }) =>
    request<{ activities: unknown[] }>("/onboarding/sharpen-the-saw", {
      method: "POST",
      body: JSON.stringify(withWeekStart(data)),
    }),
  fetchSharpenTheSaw: () =>
    request<{ activities: { sharpen_the_saw_activity_id: number; dimension: string; activity_description: string }[] }>(
      weekScoped("/onboarding/sharpen-the-saw")
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
  updateSharpenTheSawActivity: (id: number, data: { dimension?: string; activity_description?: string }) =>
    request<{ activity: { sharpen_the_saw_activity_id: number; dimension: string; activity_description: string } }>(
      `/sharpen-the-saw-activities/${id}`,
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
  googleLoginHref: () => `${API_URL}/login`,
}
