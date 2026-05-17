"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface Props {
  open: boolean
  conflictingTitle: string
  onProceed: () => void
  onCancel: () => void
}

export function ClashWarningModal({ open, conflictingTitle, onProceed, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onCancel() }}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <AlertTriangle className="w-6 h-6 text-accent flex-shrink-0" />
            Scheduling Conflict
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-serif space-y-3" asChild>
            <div>
              <p>
                This time slot overlaps with{" "}
                <span className="font-bold text-foreground">"{conflictingTitle}"</span>.
              </p>
              <p>
                Overlapping commitments can split your focus and reduce effectiveness.
                Stephen Covey advises putting first things first — a clear, conflict-free
                schedule helps you honour every commitment fully.
              </p>
              <p>Would you like to reschedule, or proceed anyway?</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-border text-foreground hover:bg-secondary/20"
          >
            Reschedule
          </Button>
          <Button
            onClick={onProceed}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
          >
            Proceed Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
