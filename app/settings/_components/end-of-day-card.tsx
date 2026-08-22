"use client"

import { useEffect, useState } from "react"
import { Clock, Loader2, Moon, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { DEFAULT_EOD_TIME } from "@/lib/eod"

export function EndOfDayCard() {
  const [eodTime, setEodTime] = useState(DEFAULT_EOD_TIME)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  /* The time is a column on the user now rather than a `localStorage` key, so it follows them to
     whichever device they open the dashboard on — which is the whole reason it moved. */
  useEffect(() => {
    let cancelled = false
    api
      .fetchEodTime()
      .then(({ eod_time }) => {
        if (!cancelled) setEodTime(eod_time)
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load your check-in time — please refresh.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const saveEodTime = async () => {
    setIsSaving(true)
    try {
      const { eod_time } = await api.updateEodTime(eodTime)
      setEodTime(eod_time)
      toast.success("End-of-day time saved")
    } catch {
      toast.error("Couldn't save your check-in time — please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Moon className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">End-of-Day Check-in</h2>
      </div>

      <div className="p-6 rounded-2xl bg-card border-2 border-border">
        <p className="text-muted-foreground font-serif text-sm mb-5">
          A check-in modal will appear on your dashboard each day after the time you set below.
          It will show once per day and prompt you to mark completed tasks and write a reflection.
        </p>

        <div className="flex items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="eod-time" className="text-foreground font-bold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Show check-in at
            </Label>
            <Input
              id="eod-time"
              type="time"
              value={eodTime}
              disabled={isLoading}
              onChange={e => setEodTime(e.target.value)}
              className="w-36 bg-muted border-border text-foreground"
            />
          </div>
          <Button
            onClick={saveEodTime}
            disabled={isLoading || isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </Button>
        </div>

        <p className="text-xs text-muted-foreground font-serif mt-3">
          Saved against your account, so it applies on every device you use.
        </p>
      </div>
    </section>
  )
}
