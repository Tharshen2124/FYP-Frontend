import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { type Week } from "../_types"

interface Props {
  editingDay: string | null
  selectedWeek: Week
  draftText: string
  onDraftChange: (text: string) => void
  onSave: () => void
  onClose: () => void
}

export function ReflectionDialog({ editingDay, selectedWeek, draftText, onDraftChange, onSave, onClose }: Props) {
  return (
    <Dialog
      open={editingDay !== null}
      onOpenChange={open => { if (!open) onClose() }}
    >
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editingDay} — {selectedWeek.label}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-serif">
            Write your reflection for this evening. What went well? What could be better?
          </DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          value={draftText}
          onChange={e => onDraftChange(e.target.value)}
          placeholder="Today I reflected on…"
          rows={8}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none font-serif"
        />
        <div className="flex gap-3 justify-end pt-2">
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-secondary/20"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!draftText.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
          >
            Save Reflection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
