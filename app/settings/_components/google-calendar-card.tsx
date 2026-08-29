"use client"

import { useState } from "react"
import { Calendar, CheckCircle2, Link2, Link2Off, Loader2, RefreshCw, RotateCcw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { PremiumLock } from "@/components/premium-lock"
import { TOP_LEVEL_ORDER } from "../_constants/categories"
import { useCalendarSettings } from "../_utils/use-calendar-settings"
import { ExportCategoryTree } from "./export-category-tree"

function lastSynced(iso: string | null): string {
  if (!iso) return "Not synced yet"
  const when = new Date(iso)
  return `Last synced ${when.toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  })}`
}

export function GoogleCalendarCard() {
  const cal = useCalendarSettings()
  const [expanded, setExpanded] = useState<Set<string>>(new Set(TOP_LEVEL_ORDER))
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Google Calendar</h2>
      </div>

      {cal.isLoading ? (
        <div className="p-6 rounded-2xl bg-card border-2 border-border flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-serif">Loading your calendar settings…</p>
        </div>
      ) : !cal.connected ? (
        <div className="p-6 rounded-2xl bg-card border-2 border-border max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Connect Google Calendar</h3>
          <p className="text-muted-foreground font-serif text-sm mb-5">
            Sync your HabitFlow schedule, tasks, and activities directly to Google Calendar so
            everything stays in one place. We&apos;ll add a separate <strong>HabitFlow</strong> calendar
            to your account, so nothing mixes with your existing events.
          </p>
          <Button
            onClick={cal.connect}
            disabled={cal.isBusy}
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full gap-2"
          >
            {cal.isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            Connect Google Calendar
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connection card */}
          <div className="p-6 rounded-2xl bg-card border-2 border-border flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-bold text-foreground">Google Calendar connected</p>
                <p className="text-sm text-muted-foreground font-serif">{lastSynced(cal.syncedAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={cal.syncNow}
                disabled={cal.isBusy}
                className="border-border text-foreground hover:bg-secondary/20 gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${cal.isBusy ? "animate-spin" : ""}`} />
                Sync now
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmingDisconnect(true)}
                disabled={cal.isBusy}
                className="border-border text-foreground hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive gap-2"
              >
                <Link2Off className="w-4 h-4" />
                Disconnect
              </Button>
            </div>
          </div>

          {/* Sync toggle. Only the *automatic* half is paid for — Sync now above it, connecting,
              disconnecting and the export tree below are all free, which is the line the pricing
              page draws between "Push your schedule to Google Calendar" and "Sync calendar edits
              automatically". */}
          <div className="p-6 rounded-2xl bg-card border-2 border-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="allow-sync" className="text-base font-bold text-foreground cursor-pointer">
                  Allow Sync Changes
                </Label>
                <p className="text-sm text-muted-foreground font-serif mt-0.5">
                  Automatically push updates to Google Calendar whenever you edit your schedule in HabitFlow.
                </p>
              </div>
              {/* Shown off rather than as stored. The column keeps whatever the user last set, so
                  upgrading brings automatic sync back without them hunting for this switch — but a
                  switch reading "on" while nothing syncs is the exact failure this card had once
                  before, and it is indistinguishable from one that does not work. */}
              <Switch
                id="allow-sync"
                checked={cal.isPremium && cal.current.allowSync}
                onCheckedChange={cal.setAllowSync}
                disabled={cal.isBusy || !cal.isPremium}
                className="shrink-0"
              />
            </div>

            {!cal.isPremium && (
              <div className="mt-4">
                <PremiumLock
                  variant="inline"
                  title="Automatic sync"
                  description="Every edit reaches Google Calendar on its own. Sync now above still pushes your schedule whenever you ask it to."
                />
              </div>
            )}
          </div>

          <ExportCategoryTree
            categories={cal.categories}
            exportIds={cal.current.exportIds}
            expanded={expanded}
            onToggleCategory={cal.toggleCategory}
            onToggleExpanded={toggleExpanded}
          />

          {/* Discard / Save */}
          {cal.isDirty && (
            <div className="sticky bottom-6 z-20">
              <div className="flex items-center justify-end gap-3 px-6 py-4 rounded-2xl bg-card border-2 border-primary/30 shadow-lg shadow-primary/10">
                <p className="text-sm text-muted-foreground font-serif flex-1">You have unsaved changes.</p>
                <Button
                  variant="outline"
                  onClick={cal.discard}
                  disabled={cal.isBusy}
                  className="border-border text-foreground hover:bg-secondary/20 gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Discard
                </Button>
                <Button
                  onClick={cal.save}
                  disabled={cal.isBusy}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  {cal.isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connecting creates an empty HabitFlow calendar and nothing else: auto-sync only fires on
          the next write, so a user who connects and changes nothing sees a calendar that stays
          blank and reads as broken. Offering the first push here is what closes that gap, and it
          is an offer rather than an automatic sync because the export categories sit right below,
          unread — someone who means to untick a role first should get to. Waiting on isLoading
          keeps it from opening over the skeleton. */}
      <AlertDialog
        open={cal.justConnected && !cal.isLoading}
        onOpenChange={open => {
          if (!open) cal.dismissJustConnected()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You&apos;re connected</AlertDialogTitle>
            <AlertDialogDescription>
              Now that you&apos;re connected, would you like us to push your tasks to your calendar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, I can click the Sync button later</AlertDialogCancel>
            <AlertDialogAction
              onClick={cal.syncNow}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Yes, push them now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disconnecting deletes the HabitFlow calendar outright, which is the only way to take its
          events with it — worth saying out loud before it happens. */}
      <AlertDialog open={confirmingDisconnect} onOpenChange={setConfirmingDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the HabitFlow calendar from your Google account, along with every event
              on it. Your HabitFlow plan itself is untouched, and you can reconnect at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={cal.disconnect}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
