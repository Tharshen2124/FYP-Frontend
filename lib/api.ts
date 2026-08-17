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
  submitSharpenTheSaw: (data: { activities: { dimension: string; activity_description: string }[] }) =>
    request<{ activities: unknown[] }>("/onboarding/sharpen-the-saw", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  googleLoginHref: () => `${API_URL}/login`,
}
