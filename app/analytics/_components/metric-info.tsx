"use client"

import { useState } from "react"
import { Info } from "lucide-react"

/**
 * The "How does this work?" disclosure every card carries.
 *
 * A click-to-open panel rather than a hover tooltip: the explanations run to a few sentences,
 * which a tooltip would either clip or cover the chart with, and a hover target is no use on a
 * touch screen. It expands in place instead of floating, so nothing can be pushed outside the
 * card or read half-off the edge of a narrow window.
 */
export function MetricInfo({ paragraphs }: { paragraphs: string[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-xs text-primary hover:underline focus:outline-none focus:underline"
      >
        <Info className="w-3.5 h-3.5 shrink-0" />
        How does this work?
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 space-y-2">
          {paragraphs.map(text => (
            <p key={text} className="text-xs text-muted-foreground font-serif leading-relaxed">
              {text}
            </p>
          ))}
          {/* True of all four cards, so it is said once here rather than repeated in each. */}
          <p className="text-xs text-muted-foreground/80 font-serif leading-relaxed italic">
            These cards only count weeks that have already finished. The week you are in now is
            still running, so it lives on your dashboard instead.
          </p>
        </div>
      )}
    </div>
  )
}
