import { Plus, Star, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type Dimension, type Activity } from "../_types"

interface Props {
  dim: Dimension
  input: string
  editingActivity: { dimId: string; actId: string; text: string } | null
  onInputChange: (dimId: string, value: string) => void
  onAdd: (dimId: string) => void
  onTogglePriority: (dimId: string, actId: string) => void
  onDeleteRequest: (dimId: string, activity: Activity) => void
  onEditStart: (dimId: string, actId: string, text: string) => void
  onEditChange: (text: string) => void
  onEditSave: () => void
  onEditCancel: () => void
}

export function DimensionCard({
  dim,
  input,
  editingActivity,
  onInputChange,
  onAdd,
  onTogglePriority,
  onDeleteRequest,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
}: Props) {
  const Icon = dim.icon

  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${dim.color}20` }}>
          <Icon className="w-6 h-6" style={{ color: dim.color }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{dim.label}</h2>
          <p className="text-sm text-muted-foreground font-serif">{dim.description}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {dim.activities.map(act => (
          <div key={act.id} className={`flex items-center justify-between p-3 rounded-xl group transition-colors ${act.isWeeklyPriority ? "bg-accent/10 border border-accent/30" : "bg-muted/50"}`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dim.color }} />
              {editingActivity?.actId === act.id ? (
                <>
                  <input
                    autoFocus
                    className="flex-1 bg-transparent text-foreground font-serif outline-none border-b border-primary"
                    value={editingActivity.text}
                    onChange={e => onEditChange(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") onEditSave()
                      if (e.key === "Escape") onEditCancel()
                    }}
                  />
                  <button
                    onMouseDown={e => { e.preventDefault(); onEditSave() }}
                    className="shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="text-foreground font-serif truncate cursor-text hover:text-primary transition-colors"
                    onClick={() => onEditStart(dim.id, act.id, act.text)}
                  >
                    {act.text}
                  </span>
                  {act.isWeeklyPriority && (
                    <span className="text-xs font-medium bg-accent/20 text-accent rounded-full px-2 py-0.5 whitespace-nowrap">Priority</span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTogglePriority(dim.id, act.id)}
                className={`p-1 h-auto transition-opacity ${act.isWeeklyPriority ? "text-accent" : "text-muted-foreground hover:text-accent opacity-0 group-hover:opacity-100"}`}
                title={act.isWeeklyPriority ? "Remove weekly priority" : "Mark as weekly priority"}
              >
                <Star className={`w-4 h-4 ${act.isWeeklyPriority ? "fill-accent" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteRequest(dim.id, act)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity flex-shrink-0 p-1 h-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder={`Add a ${dim.label.toLowerCase()} activity...`}
          value={input}
          onChange={e => onInputChange(dim.id, e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") onAdd(dim.id) }}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
        <Button onClick={() => onAdd(dim.id)} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
