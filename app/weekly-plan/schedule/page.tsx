"use client"

import { useState } from "react"
import { AppNav } from "@/components/app-nav"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FixedTab } from "./_components/fixed-tab"
import { TasksTab } from "./_components/tasks-tab"
import type { Appt, Task } from "./_types"

export default function WeeklyPlanSchedulePage() {
  const [appts, setAppts] = useState<Appt[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  const canProceed = tasks.length > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav action="next" nextHref="/dashboard" nextEnabled={canProceed} />

      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Weekly <span className="text-primary">Schedule</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              Block out your fixed commitments, then schedule tasks linked to your goals and renewal activities.
            </p>
          </div>

          <Tabs defaultValue="fixed" className="w-full">
            <TabsList className="mb-6 bg-card border border-border h-auto p-1">
              <TabsTrigger
                value="fixed"
                className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Fixed Appointments
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Scheduled Tasks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fixed">
              <FixedTab appts={appts} setAppts={setAppts} />
            </TabsContent>

            <TabsContent value="tasks">
              <TasksTab appts={appts} tasks={tasks} setTasks={setTasks} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
