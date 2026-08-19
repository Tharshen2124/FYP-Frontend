"use client"

import { Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Props {
  goalText?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onConfirm: () => void
}

export function ArchiveGoalDialog({ goalText, open, onOpenChange, onCancel, onConfirm }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Archive className="w-6 h-6 text-accent" />
            Remove Goal?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-muted-foreground font-serif space-y-3">
              <p>
                <span className="font-bold text-foreground">&ldquo;{goalText}&rdquo;</span> will be
                dropped from this week.
              </p>
              <p>
                Any unfinished tasks for it come off your calendar. Tasks you already completed stay
                where they are and keep counting towards your history and analytics.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onCancel} className="border-border text-foreground hover:bg-secondary/20">Cancel</Button>
          <Button onClick={onConfirm} className="bg-accent text-accent-foreground hover:bg-accent/90">Remove Goal</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
