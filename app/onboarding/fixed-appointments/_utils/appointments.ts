import { minsToStr } from "./time"
import type { Appt } from "../_types"

/** Shapes local appointment state into the snake_case payload the backend expects. */
export function toFixedAppointmentsPayload(appts: Appt[]) {
  return {
    appointments: appts.map(a => ({
      title: a.title,
      day_of_week: a.dayIndex,
      start_time: minsToStr(a.startMins),
      end_time: minsToStr(a.endMins),
    })),
  }
}
