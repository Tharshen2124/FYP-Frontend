"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Role } from "../_types"

interface Props {
  role: Role | null
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteRoleDialog({ role, onOpenChange, onCancel, onConfirm }: Props) {
  const goalCount = role?.goals.length ?? 0

  return (
    <AlertDialog open={!!role} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Trash2 className="w-6 h-6 text-destructive" />
            Delete Role?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground font-serif">
            <span className="font-bold text-foreground">{role?.name}</span> has{" "}
            <span className="font-bold text-foreground">{goalCount} {goalCount === 1 ? "goal" : "goals"}</span> associated with it.
            Deleting this role will permanently remove all its goals.
            <br /><br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onCancel} className="border-border text-foreground hover:bg-secondary/20">Cancel</Button>
          <Button onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Role</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
