"use client"

import { TriangleAlert } from "lucide-react"
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
  open: boolean
  onOpenChange: (open: boolean) => void
  onStay: () => void
  onLeave: () => void
}

/**
 * Asked when Back to Dashboard is pressed with edits still outstanding.
 *
 * Nothing on this page writes as you go — a task dragged to Thursday lives in local state until
 * Save — so leaving is the one gesture that can silently throw the work away. The Save bar says a
 * save is pending, but it sits at the bottom of a page whose calendar scrolls, so it is not
 * necessarily on screen at the moment the user reaches for Back.
 */
export function LeaveUnsavedDialog({ open, onOpenChange, onStay, onLeave }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
            <TriangleAlert className="w-6 h-6 text-destructive" />
            Leave without saving?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground font-serif">
            Your changes to this week&apos;s schedule haven&apos;t been saved yet. Leaving now
            puts the week back exactly as it was.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={onStay}
            className="border-border text-foreground hover:bg-secondary/20"
          >
            Keep Editing
          </Button>
          <Button
            onClick={onLeave}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Discard and Leave
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
