import { Loader2, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type Week } from "../_types"

interface Props {
  week: Week
  hasAnyReflection: boolean
  generatingSummary: boolean
  onGenerate: () => void
}

export function WeeklySummaryCard({ week, hasAnyReflection, generatingSummary, onGenerate }: Props) {
  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-foreground">Weekly Summary</h2>
        {!week.summary && (
          <Button
            onClick={onGenerate}
            disabled={generatingSummary || !hasAnyReflection}
            className="bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50"
          >
            {generatingSummary ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Summary
              </>
            )}
          </Button>
        )}
        {week.summary && (
          <Button
            variant="outline"
            onClick={onGenerate}
            disabled={generatingSummary}
            className="border-border text-foreground hover:bg-secondary/20"
          >
            {generatingSummary ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            Regenerate
          </Button>
        )}
      </div>
      {week.summary ? (
        <p className="text-muted-foreground font-serif leading-relaxed">{week.summary}</p>
      ) : (
        <p className="text-muted-foreground font-serif text-sm italic">
          {hasAnyReflection
            ? "Click 'Generate Summary' to get an AI-powered overview of your week's reflections."
            : "Add at least one daily reflection before generating a summary."}
        </p>
      )}
    </div>
  )
}
