"use client"

import { Loader2, Sparkles, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { REQUIRED_DAYS } from "../_constants/reflections"
import type { WeekSummary } from "../_types"

interface Props {
  summary: WeekSummary | null
  reflectionCount: number
  canGenerate: boolean
  generating: boolean
  error: string | null
  onGenerate: () => void
}

function formatGeneratedAt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function WeeklySummaryCard({
  summary,
  reflectionCount,
  canGenerate,
  generating,
  error,
  onGenerate,
}: Props) {
  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border mb-8">
      <div className="flex items-center justify-between mb-3 gap-4">
        <h2 className="text-xl font-bold text-foreground">Weekly Summary</h2>

        {/*
          There is deliberately no Regenerate. A summary is generated once per week and never
          again, so once one exists this card carries no action at all — and after a failure
          nothing was stored, which makes pressing again a first attempt, not a second one.
        */}
        {!summary && (
          <Button
            onClick={onGenerate}
            disabled={generating || !canGenerate}
            className="bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50 shrink-0"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reading your week…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                {error ? "Try Again" : "Generate Summary"}
              </>
            )}
          </Button>
        )}
      </div>

      {summary ? (
        <>
          <p data-weekly-summary className="text-muted-foreground font-serif leading-relaxed whitespace-pre-wrap">
            {summary.text}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70 font-serif mt-4">
            <Sparkles className="w-3 h-3 text-accent" />
            Generated {formatGeneratedAt(summary.generatedAt)}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground font-serif text-sm italic">
          {canGenerate
            ? "Your week is complete. Generate a summary to see the patterns across all seven days — you can do this once."
            : `Write all ${REQUIRED_DAYS} daily reflections to unlock your summary. ${reflectionCount} of ${REQUIRED_DAYS} written.`}
        </p>
      )}

      {error && <p className="text-sm text-destructive font-serif mt-4">{error}</p>}
    </div>
  )
}
