"use client"

import { Sidebar } from "@/components/sidebar"
import { EndOfDayCard } from "./_components/end-of-day-card"
import { GoogleCalendarCard } from "./_components/google-calendar-card"

export default function SettingsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      <main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
            <span className="text-primary">Settings</span>
          </h1>
          <p className="text-muted-foreground font-serif">
            Configure your HabitFlow experience.
          </p>
        </div>

        <div className="space-y-10">
          <EndOfDayCard />
          <GoogleCalendarCard />
        </div>
      </main>
    </div>
  )
}
