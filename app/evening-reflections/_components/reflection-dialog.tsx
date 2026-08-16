"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Props {
  day: string | null
  weekLabel: string
  draftText: string
  onDraftChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onSave: () => void
}

export function ReflectionDialog({
  day,
  weekLabel,
  draftText,
  onDraftChange,
  onOpenChange,
  onCancel,
  onSave,
}: Props) {
  return (
    <Dialog open={day !== null} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {day} — {weekLabel}
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
            onClick={onCancel}
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
