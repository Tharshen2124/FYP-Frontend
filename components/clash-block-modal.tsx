"use client"

import { Ban } from "lucide-react"
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
  onClose: () => void
}

export function ClashBlockModal({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Ban className="w-6 h-6 text-destructive flex-shrink-0" />
            Too Many Conflicts
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-serif space-y-3" asChild>
            <div>
              <p>
                This time slot already has <span className="font-bold text-foreground">2 overlapping appointments</span>.
              </p>
              <p>
                Having more than 2 events at the same time makes it nearly impossible to honour
                your commitments and stays true to your priorities. Your schedule reflects your
                character — keep it intentional.
              </p>
              <p>
                Please reschedule this appointment to a free or less crowded time slot.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
          >
            OK, I&apos;ll Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
