import Link from "next/link"
import { CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Shown when the user has no plan for the current week — either their onboarding week has ended,
 * or they simply haven't planned this one yet. If they had already set this week up through
 * "Schedule Upcoming Weekly Plan", the plan would exist and the timetable would render instead.
 */
export function NoPlanCard() {
  return (
    <div className="bg-card border-2 border-border rounded-2xl">
      <div className="flex flex-col items-center justify-center text-center gap-5 px-6 py-20">
        <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
          <CalendarPlus className="w-7 h-7 text-primary" />
        </div>

        <div className="max-w-md">
          <h2 className="text-xl font-bold text-foreground mb-2">
            This week isn&apos;t planned yet
          </h2>
          <p className="text-muted-foreground font-serif">
            Your last weekly plan has ended. Choose the goals you want to work towards, pick your
            Sharpen the Saw activities, and put them in the calendar.
          </p>
        </div>

        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
          <Link href="/weekly-plan/goals">
            <CalendarPlus className="w-4 h-4 mr-2" />
            Create Weekly Plan
          </Link>
        </Button>
      </div>
    </div>
  )
}
