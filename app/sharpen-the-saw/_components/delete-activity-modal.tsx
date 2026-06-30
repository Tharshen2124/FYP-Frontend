import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { type Activity } from "../_types"

interface Props {
  target: { dimId: string; activity: Activity } | null
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteActivityModal({ target, onCancel, onConfirm }: Props) {
  return (
    <AlertDialog open={!!target} onOpenChange={open => { if (!open) onCancel() }}>
      <AlertDialogContent className="bg-card border-border text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
            <X className="w-6 h-6 text-destructive" />
            Delete Activity?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground font-serif">
            Are you sure you want to delete{" "}
            <span className="font-bold text-foreground">&ldquo;{target?.activity.text}&rdquo;</span>?
            <br /><br />
            This activity may be linked to scheduled tasks. Deleting it will not remove those tasks, but they will lose their activity association.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onCancel} className="border-border text-foreground hover:bg-secondary/20">Cancel</Button>
          <Button onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Activity</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
