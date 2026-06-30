import { Clock, Moon, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  eodTime: string
  onTimeChange: (value: string) => void
}

export function EodSection({ eodTime, onTimeChange }: Props) {
  const save = () => {
    localStorage.setItem("eod_time", eodTime)
    localStorage.removeItem("eod_shown_date")
    toast.success("End-of-day time saved")
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
              onChange={e => onTimeChange(e.target.value)}
              className="w-36 bg-muted border-border text-foreground"
            />
          </div>
          <Button onClick={save} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>

        <p className="text-xs text-muted-foreground font-serif mt-3">
          Saving resets today&apos;s shown state so the modal will re-appear at the new time.
        </p>
      </div>
    </section>
  )
}
