import { RotateCcw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface Props {
  onDiscard: () => void
  onSave: () => void
  isSaving: boolean
}

/**
 * The Discard / Save bar, shown only while the calendar differs from the stored week.
 *
 * The same shape `/settings` uses, and for the same reason: nothing on this page writes as you go,
 * so the one thing the user needs to know is that a save is outstanding. It sticks to the bottom
 * of the viewport because the calendar is 1024px tall inside its own scroll box — a bar at the end
 * of the document would sit below the fold for most of the page.
 */
export function UnsavedChangesBar({ onDiscard, onSave, isSaving }: Props) {
  return (
    <div className="sticky bottom-6 z-20 mt-6">
      <div className="flex items-center justify-end gap-3 px-6 py-4 rounded-2xl bg-card border-2 border-primary/30 shadow-lg shadow-primary/10">
        <p className="text-sm text-muted-foreground font-serif flex-1">
          You have unsaved changes to this week.
        </p>
        <Button
          variant="outline"
          onClick={onDiscard}
          disabled={isSaving}
          className="border-border text-foreground hover:bg-secondary/20 gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Discard
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          {isSaving ? <Spinner className="size-4" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
