"use client"

import Link from "next/link"
import { CalendarDays, Lock, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "./_components/sidebar"
import { WeeklyTimetable } from "./_components/weekly-timetable"

export default function DashboardPage() {
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
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
              Schedule for <span className="text-primary">this Week</span>
            </h1>
            <p className="text-muted-foreground font-serif">
              Your full week at a glance — fixed appointments and scheduled tasks.
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0" asChild>
            <Link href="/schedule-tasks">
              <CalendarDays className="w-4 h-4 mr-2" />
              Edit Weekly Plan
            </Link>
          </Button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>Fixed appointment</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span>Daily priority</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Now</span>
          </div>
        </div>

        <WeeklyTimetable />
      </main>
    </div>
  )
}
