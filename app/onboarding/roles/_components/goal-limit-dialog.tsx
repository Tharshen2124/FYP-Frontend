"use client"

import { AlertTriangle } from "lucide-react"
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
  totalGoals: number
  onCancel: () => void
  onConfirm: () => void
}

export function GoalLimitDialog({ open, totalGoals, onCancel, onConfirm }: Props) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="bg-card border-border text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
            <AlertTriangle className="w-6 h-6 text-accent" />
            Too Many Goals?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground font-serif">
            You already have <span className="font-bold text-foreground">{totalGoals} goals</span> for this week.
            Adding more may reduce your effectiveness and increase overwhelm.
            <br /><br />
            <span className="text-foreground">&quot;The main thing is to keep the main thing the main thing.&quot;</span>
            <br />
            <span className="text-sm italic">— Stephen Covey</span>
            <br /><br />
            Consider completing or removing some goals before adding new ones.
            Are you sure you want to add this goal?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onCancel} className="border-border text-foreground hover:bg-secondary/20">Go Back</Button>
          <Button onClick={onConfirm} className="bg-accent text-accent-foreground hover:bg-accent/90">Add Anyway</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
