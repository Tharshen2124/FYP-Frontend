"use client"

import { Loader2 } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { PlanComparison } from "@/components/plan-comparison"
import { CurrentPlanCard } from "./_components/current-plan-card"
import { useSubscription } from "./_utils/use-subscription"

export default function SubscriptionPage() {
  const { subscription, plan, isLoading, isBusy, upgrade, manage } = useSubscription()
  const currentPlan = subscription?.premium ? "premium" : "free"

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      <main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">
        {/* Rendered before the fetch resolves as well as after: the nav test asserts every route
            shows a heading, and a page whose title arrives late reads as a broken one. */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
            <span className="text-primary">Subscription</span>
          </h1>
          <p className="text-muted-foreground font-serif">
            Choose the plan that fits how you want to use HabitFlow.
          </p>
        </div>

        {isLoading || !subscription ? (
          <div className="p-6 rounded-2xl bg-card border-2 border-border flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-serif">Loading your subscription…</p>
          </div>
        ) : (
          <div className="space-y-10">
            <CurrentPlanCard subscription={subscription} isBusy={isBusy} onManage={manage} />

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Compare plans</h2>
              <PlanComparison
                currentPlan={currentPlan}
                plan={plan}
                onUpgrade={upgrade}
                isBusy={isBusy}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
