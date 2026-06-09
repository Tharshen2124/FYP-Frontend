"use client"

import { Sidebar } from "@/app/dashboard/_components/sidebar"
import { SharpenSawChart } from "./_components/sharpen-saw-chart"
import { RoleTaskTable } from "./_components/role-task-table"
import { DailyPriorityChart } from "./_components/daily-priority-chart"
import { WeeklyCompletionTable } from "./_components/weekly-completion-table"

export default function AnalyticsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      <main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
            Your <span className="text-primary">Analytics</span>
          </h1>
          <p className="text-muted-foreground font-serif">
            Track your progress across roles, goals, and weekly task completion.
          </p>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SharpenSawChart />
          <RoleTaskTable />
          <DailyPriorityChart />
          <WeeklyCompletionTable />
        </div>
      </main>
    </div>
  )
}
