"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { HISTORY_WEEKS } from "./_constants/mock-data"
import { WeekList } from "./_components/week-list"
import { WeekDetail } from "./_components/week-detail"

export default function HistoryPage() {
  const [selectedId, setSelectedId] = useState(HISTORY_WEEKS[0].id)
  const selectedWeek = HISTORY_WEEKS.find(w => w.id === selectedId)!

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      {/* Inner two-panel layout */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        <WeekList weeks={HISTORY_WEEKS} selectedId={selectedId} onSelect={setSelectedId} />

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <WeekDetail key={selectedId} week={selectedWeek} />
        </main>
      </div>
    </div>
  )
}
