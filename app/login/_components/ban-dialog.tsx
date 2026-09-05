"use client"

import { Ban } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { BanNotice } from "@/lib/api"
import { BAN_TITLE, banMessage } from "../_constants/auth"

interface Props {
  notice: BanNotice | null
  onDismiss: () => void
}

/**
 * Why a dialog and not the toast every other login failure gets: a ban is not something to try
 * again. A toast is dismissed by waiting, which is the right shape for "that was the wrong
 * password" and the wrong one for a message carrying an address the user has to write down.
 *
 * It is reached from all three doors a ban can be discovered at — the password form, the return
 * from Google, and a session cut off mid-use — because each of those ends up on this page with a
 * `BanNotice` in hand.
 */
export function BanDialog({ notice, onDismiss }: Props) {
  return (
    <AlertDialog open={notice !== null} onOpenChange={open => !open && onDismiss()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Ban aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>{BAN_TITLE}</AlertDialogTitle>
          <AlertDialogDescription className="font-serif">
            {notice && banMessage(notice)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onDismiss}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
