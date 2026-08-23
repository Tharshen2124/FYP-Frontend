"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppNav } from "@/components/app-nav"
import { PastDaysNotice } from "@/components/past-days-notice"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FixedTab } from "../_components/fixed-tab"
import { TasksTab } from "../_components/tasks-tab"
import { useWeekSchedule } from "../_utils/use-week-schedule"
import { usePlanWeekDays } from "../_utils/use-plan-week"
import { useTargetWeek } from "../_utils/use-target-week"

export default function WeeklyPlanSchedulePage() {
  const router = useRouter()
  const week = useTargetWeek()
  const schedule = useWeekSchedule(week.weekStart)
  // Both tabs draw the same seven columns, so the notice sits above them rather than in each one.
  // It says nothing for a week other than the current one, where no day has passed yet.
  const days = usePlanWeekDays(week.weekStart)

  const handleNext = async () => {
    if (!(await schedule.save())) return

    // The dashboard only ever shows the current week, so finishing a plan for next week would
    // otherwise land on a screen that looks exactly as it did before — three steps of work with
    // nothing to show for them.
    if (!week.isCurrentWeek) {
      toast.success(`Your plan for ${week.label} is ready — it'll show here on Monday.`)
    }
    router.push("/dashboard")
  }

  const canProceed = schedule.tasks.length > 0 && !schedule.isLoading && !schedule.isSaving

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav action="next" onNext={handleNext} nextEnabled={canProceed} />

      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Weekly <span className="text-primary">Schedule</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              Block out your fixed commitments, then schedule tasks linked to your goals and
              Sharpen the Saw activities. The dates across the top are the week you&apos;re planning.
            </p>
          </div>

          {schedule.isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <Spinner className="size-8 text-primary" />
              <p className="text-sm text-muted-foreground font-serif">
                Loading this week&apos;s goals, activities and calendar…
              </p>
            </div>
          ) : schedule.loadError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <p className="text-sm text-muted-foreground font-serif">
                Something went wrong loading this week.
              </p>
              <Button
                onClick={schedule.reload}
                variant="outline"
                className="border-border text-foreground hover:bg-secondary/20"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
            <PastDaysNotice todayIdx={days?.todayIdx ?? null} creates="tasks or fixed appointments" />

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
                <FixedTab appts={schedule.appts} setAppts={schedule.setAppts} weekStart={week.weekStart} />
              </TabsContent>

              <TabsContent value="tasks">
                <TasksTab
                  appts={schedule.appts}
                  tasks={schedule.tasks}
                  setTasks={schedule.setTasks}
                  roles={schedule.roles}
                  dimensions={schedule.dimensions}
                  weekStart={week.weekStart}
                />
              </TabsContent>
            </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
