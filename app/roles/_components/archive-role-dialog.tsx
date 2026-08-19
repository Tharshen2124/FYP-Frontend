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
import { plural } from "../_utils/roles"
import type { PendingRoleArchive } from "../_types"

interface Props {
  pending: PendingRoleArchive | null
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Archiving is deliberately not framed as deleting. The role and everything it recorded stay in
 * the database, so the dialog states exactly what changes this week and what does not.
 */
export function ArchiveRoleDialog({ pending, onOpenChange, onCancel, onConfirm }: Props) {
  const preview = pending?.preview

  return (
    <AlertDialog open={!!pending} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Archive className="w-6 h-6 text-accent" />
            Archive Role?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-muted-foreground font-serif space-y-3">
              <p>
                <span className="font-bold text-foreground">{pending?.role.name}</span> will stop
                appearing when you plan future weeks. Everything it recorded in past weeks stays
                exactly as it is.
              </p>

              {preview === undefined || preview === null ? (
                <p>Checking what this affects&hellip;</p>
              ) : (
                <div className="rounded-xl bg-muted/50 p-3 space-y-1.5">
                  <p className="font-bold text-foreground">This week</p>
                  <ul className="space-y-1">
                    <li>
                      <span className="font-bold text-foreground">
                        {preview.goals} {plural(preview.goals, "goal")}
                      </span>{" "}
                      will be removed
                    </li>
                    {preview.incompleteTasks > 0 && (
                      <li>
                        <span className="font-bold text-foreground">
                          {preview.incompleteTasks} unfinished{" "}
                          {plural(preview.incompleteTasks, "task")}
                        </span>{" "}
                        will come off your calendar
                      </li>
                    )}
                    {preview.completedTasks > 0 && (
                      <li>
                        <span className="font-bold text-foreground">
                          {preview.completedTasks} completed{" "}
                          {plural(preview.completedTasks, "task")}
                        </span>{" "}
                        stays on your calendar and keeps counting in your history and analytics
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <p>You can restore this role at any time.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onCancel} className="border-border text-foreground hover:bg-secondary/20">Cancel</Button>
          <Button onClick={onConfirm} className="bg-accent text-accent-foreground hover:bg-accent/90">Archive Role</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
