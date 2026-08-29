import type { ApiPlan, ApiSubscription } from "@/lib/api"

export type Subscription = ApiSubscription
export type Plan = ApiPlan

export interface SubscriptionState {
  subscription: Subscription | null
  plan: Plan | null
  isLoading: boolean
  /** True while a redirect to Stripe or a confirm is in flight, so both buttons disable together. */
  isBusy: boolean
  upgrade: () => Promise<void>
  manage: () => Promise<void>
}
