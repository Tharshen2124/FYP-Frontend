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
      body: JSON.stringify(data),
    }),
  fetchRoles: () =>
    request<{
      roles: { role_id: number; name: string; icon_id: string; goals: { goal_id: number; text: string; is_weekly_priority: boolean }[] }[]
    }>("/onboarding/roles"),
  submitSharpenTheSaw: (data: { activities: { dimension: string; activity_description: string }[] }) =>
    request<{ activities: unknown[] }>("/onboarding/sharpen-the-saw", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  fetchSharpenTheSaw: () =>
    request<{ activities: { sharpen_the_saw_activity_id: number; dimension: string; activity_description: string }[] }>(
      "/onboarding/sharpen-the-saw"
    ),
  submitFixedAppointments: (data: {
    appointments: { title: string; description: string; day_of_week: number; start_time: string; end_time: string }[]
  }) =>
    request<{ appointments: unknown[] }>("/onboarding/fixed-appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  fetchFixedAppointments: () =>
    request<{
      appointments: { task_id: number; title: string; description: string; day_of_week: number; start_time: string; end_time: string }[]
    }>("/onboarding/fixed-appointments"),
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
      body: JSON.stringify(data),
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
    }>("/onboarding/schedule-tasks"),
  googleLoginHref: () => `${API_URL}/login`,
}
