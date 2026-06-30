"use client"

import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { HISTORY_WEEKS } from "./_constants/mock-data"
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

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <aside className="w-56 shrink-0 border-r border-border flex flex-col overflow-y-auto bg-card/40">
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Past Weeks</span>
            </div>
          </div>
          <ul className="flex-1 py-2">
            {HISTORY_WEEKS.map(week => (
              <li key={week.id}>
                <button
                  onClick={() => setSelectedId(week.id)}
                  className={[
                    "w-full text-left px-4 py-3 transition-colors",
                    week.id === selectedId
                      ? "bg-primary/15 border-r-2 border-primary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/20 hover:text-foreground",
                  ].join(" ")}
                >
                  <p className="text-xs font-serif leading-snug">{week.label}</p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <WeekDetail key={selectedId} week={selectedWeek} />
        </main>
      </div>
    </div>
  )
}
