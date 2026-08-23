"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CalendarClock } from "lucide-react"
import { toast } from "sonner"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useCurrentWeek } from "@/hooks/use-current-week"
import { formatWeekRange, localDateParam } from "@/lib/date"
import { FixedTab } from "../_components/fixed-tab"
import { TasksTab } from "../_components/tasks-tab"
import { useWeekSchedule } from "../_utils/use-week-schedule"
import { UnsavedChangesBar } from "./_components/unsaved-changes-bar"
import { LeaveUnsavedDialog } from "./_components/leave-unsaved-dialog"

/**
 * Editing the week that is already running, as opposed to planning one.
 *
 * It is deliberately not step 3 of the wizard pointed at the current week. That step's Next means
 * "finish planning" — it gates on there being at least one task and walks the user out of a flow.
 * This is a single surface with a Save bar: open it, move one thing, save, go back.
 *
 * **Every day of the week is live here, including the ones that have gone.** That is the whole
 * point: a task Tuesday did not get done is dragged to Thursday, and Tuesday is where it is
 * dragged *from*. The planning calendars block a past day because work scheduled into one could
 * never be done, but rearranging a week in progress is the case that rule was never about — so
 * both tabs are handed `pastDays="open"` and neither draws a `PastDaysNotice`.
 *
 * The week is always the current one, with no `?week_start=`: this is reached from `/dashboard`,
 * which only ever shows the week the user is standing in, and that is the only week the app treats
 * as writable (`isEditableWeek` in `lib/date.ts`). Next week is still planned through the wizard.
 */
export default function WeeklyPlanEditPage() {
  const router = useRouter()
  // Via the hook rather than `localWeekStartParam()` directly: today is a client fact, and reading
  // the clock during the server render would bake the server's Monday into the HTML.
  const current = useCurrentWeek()
  const weekStart = current ? localDateParam(current.dayDates[0]) : ""

  const schedule = useWeekSchedule(weekStart)
  const [leaveOpen, setLeaveOpen] = useState(false)

  const leave = () => router.push("/dashboard")

  const handleBack = () => {
    if (schedule.isDirty) setLeaveOpen(true)
    else leave()
  }

  const handleSave = async () => {
    if (!(await schedule.save())) return
    toast.success("Your week has been updated.")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      <main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
              Edit <span className="text-primary">This Week</span>
            </h1>
            <p className="text-muted-foreground font-serif">
              {weekStart
                ? `${formatWeekRange(weekStart)} — move, rename or remove anything on the calendar.`
                : "Move, rename or remove anything on the calendar."}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleBack}
            className="border-border text-foreground hover:bg-secondary/20 shrink-0 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        {schedule.isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Spinner className="size-8 text-primary" />
            <p className="text-sm text-muted-foreground font-serif">Loading this week&apos;s schedule…</p>
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
            {/* The counterpart to `PastDaysNotice` on the planning calendars: there it names the
                days that are shut, here it says none of them are. */}
            <div className="mb-4 flex items-start gap-2.5 rounded-md border border-border bg-muted/40 px-4 py-3">
              <CalendarClock className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-serif">
                <span className="font-sans font-bold text-foreground">
                  Every day of this week is open, including the ones that have passed.
                </span>{" "}
                Something Tuesday didn&apos;t get done can be moved to Thursday. Nothing is saved
                until you press Save Changes.
              </p>
            </div>

            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="mb-6 bg-card border border-border h-auto p-1">
                <TabsTrigger
                  value="tasks"
                  className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Scheduled Tasks
                </TabsTrigger>
                <TabsTrigger
                  value="fixed"
                  className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Fixed Appointments
                </TabsTrigger>
              </TabsList>

              {/* Tasks first, unlike the planning step: fixed appointments are the standing part of
                  a week and the reason to open this page is almost always a task that moved. */}
              <TabsContent value="tasks">
                <TasksTab
                  appts={schedule.appts}
                  tasks={schedule.tasks}
                  setTasks={schedule.setTasks}
                  roles={schedule.roles}
                  dimensions={schedule.dimensions}
                  weekStart={weekStart}
                  pastDays="open"
                />
              </TabsContent>

              <TabsContent value="fixed">
                <FixedTab
                  appts={schedule.appts}
                  setAppts={schedule.setAppts}
                  weekStart={weekStart}
                  pastDays="open"
                />
              </TabsContent>
            </Tabs>

            {schedule.isDirty && (
              <UnsavedChangesBar
                onDiscard={schedule.discard}
                onSave={handleSave}
                isSaving={schedule.isSaving}
              />
            )}
          </>
        )}
      </main>

      <LeaveUnsavedDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        onStay={() => setLeaveOpen(false)}
        onLeave={leave}
      />
    </div>
  )
}
