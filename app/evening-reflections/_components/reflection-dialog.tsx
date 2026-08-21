"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DAYS, MAX_REFLECTION_LENGTH } from "../_constants/reflections"

interface Props {
  dayIndex: number | null
  dateLabel: string
  draftText: string
  readOnly: boolean
  isSaving: boolean
  onDraftChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onSave: () => void
}

export function ReflectionDialog({
  dayIndex,
  dateLabel,
  draftText,
  readOnly,
  isSaving,
  onDraftChange,
  onOpenChange,
  onCancel,
  onSave,
}: Props) {
  const day = dayIndex === null ? "" : DAYS[dayIndex]
  const tooLong = draftText.length > MAX_REFLECTION_LENGTH

  return (
    <Dialog open={dayIndex !== null} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{day}</DialogTitle>
          <DialogDescription className="text-muted-foreground font-serif">
            {readOnly
              ? `Written for ${dateLabel}. This week has ended, so it can no longer be changed.`
              : "Write your reflection for this evening. What went well? What could be better?"}
          </DialogDescription>
        </DialogHeader>

        {readOnly ? (
          /* Rendered as prose rather than a disabled textarea: a focusable control that does
             nothing is worse than no control at all. */
          <p className="text-sm text-foreground font-serif leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto rounded-xl bg-muted p-4">
            {draftText}
          </p>
        ) : (
          <>
            <Textarea
              autoFocus
              value={draftText}
              onChange={e => onDraftChange(e.target.value)}
              placeholder="Today I reflected on…"
              rows={8}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none font-serif"
            />
            <p className={`text-xs font-serif text-right ${tooLong ? "text-destructive" : "text-muted-foreground"}`}>
              {draftText.length} / {MAX_REFLECTION_LENGTH}
            </p>
          </>
        )}

        <div className="flex gap-3 justify-end pt-2">
          {readOnly ? (
            <Button
              variant="outline"
              /* shadcn's DialogContent renders its own "Close" X, so this needs a name of its own
                 to stay unambiguous to assistive tech and to the e2e suite alike. */
              aria-label="Close reflection"
              className="border-border text-foreground hover:bg-secondary/20"
              onClick={onCancel}
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-secondary/20"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                onClick={onSave}
                disabled={!draftText.trim() || tooLong || isSaving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Reflection
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
