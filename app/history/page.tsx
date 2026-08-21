"use client"

import { Sidebar } from "@/components/sidebar"
import { useHistory } from "./_utils/use-history"
import { WeekList } from "./_components/week-list"
import { WeekDetail } from "./_components/week-detail"

export default function HistoryPage() {
  const history = useHistory()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      {/* Inner two-panel layout */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        <WeekList
          weeks={history.weeks}
          selectedWeekStart={history.weekStart}
          onSelectWeek={history.selectWeek}
          onJumpToDate={history.jumpToDate}
          onLoadOlder={history.loadOlderWeeks}
          maxDate={history.newest}
        />

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <WeekDetail
            weekStart={history.weekStart}
            week={history.week}
            isLoading={history.isLoading}
          />
        </main>
      </div>
    </div>
  )
}
