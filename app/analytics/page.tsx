"use client"

import { Loader2 } from "lucide-react"
import Link from "next/link"
import { Sidebar } from "@/components/sidebar"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { SharpenSawChart } from "./_components/sharpen-saw-chart"
import { RoleTaskTable } from "./_components/role-task-table"
import { DailyPriorityChart } from "./_components/daily-priority-chart"
import { WeeklyCompletionTable } from "./_components/weekly-completion-table"
import { useAnalytics } from "./_utils/use-analytics"

export default function AnalyticsPage() {
  const { isReady } = useRequireAuth()
  const analytics = useAnalytics(isReady)

  if (!isReady) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      <main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">
        {/* Page header. Rendered before the data arrives on purpose: every route is asserted to
            show a heading immediately by tests/e2e/app-navigation.spec.ts. */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
            Your <span className="text-primary">Analytics</span>
          </h1>
          <p className="text-muted-foreground font-serif">
            Track your progress across roles, goals, and weekly task completion.
          </p>
        </div>

        {analytics.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-serif">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your analytics…
          </div>
        ) : !analytics.hasWeeks ? (
          /* One message for the whole page rather than four empty charts. Analytics only reads
             weeks that have finished, so a new user has nothing here until their first week ends. */
          <div className="p-6 rounded-2xl bg-card border-2 border-border max-w-xl">
            <h2 className="text-lg font-bold text-foreground mb-1">Nothing to analyse yet</h2>
            <p className="text-sm text-muted-foreground font-serif">
              These charts read weeks that have finished, so there is nothing to show until your
              first planned week is over.{" "}
              <Link href="/weekly-plan/goals" className="text-primary hover:underline">
                Plan a week
              </Link>{" "}
              and come back next Monday.
            </p>
          </div>
        ) : (
          /* 2×2 grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SharpenSawChart {...analytics.sharpen} years={analytics.years} />
            <RoleTaskTable {...analytics.roles} years={analytics.years} />
            <DailyPriorityChart {...analytics.priority} years={analytics.years} />
            <WeeklyCompletionTable weeks={analytics.completions} />
          </div>
        )}
      </main>
    </div>
  )
}
