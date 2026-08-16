"use client"

import { Check, Plus, Star, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Dimension, EditingActivity } from "../_types"

interface Props {
  dimension: Dimension
  input: string
  editingActivity: EditingActivity | null
  onInputChange: (value: string) => void
  onAddActivity: () => void
  onStartEdit: (editing: EditingActivity) => void
  onChangeEdit: (editing: EditingActivity) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onTogglePriority: (actId: string) => void
  onDeleteActivity: (actId: string) => void
}

export function DimensionCard({
  dimension,
  input,
  editingActivity,
  onInputChange,
  onAddActivity,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onCancelEdit,
  onTogglePriority,
  onDeleteActivity,
}: Props) {
  const Icon = dimension.icon

  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${dimension.color}20` }}>
          <Icon className="w-6 h-6" style={{ color: dimension.color }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{dimension.label}</h2>
          <p className="text-sm text-muted-foreground font-serif">{dimension.description}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {dimension.activities.map(act => (
          <div
            key={act.id}
            className={`flex items-center justify-between p-3 rounded-xl group transition-colors ${act.isWeeklyPriority ? "bg-accent/10 border border-accent/30" : "bg-muted/50"}`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dimension.color }} />
              {editingActivity?.actId === act.id ? (
                <>
                  <input
                    autoFocus
                    aria-label="Edit activity"
                    className="flex-1 bg-transparent text-foreground font-serif outline-none border-b border-primary"
                    value={editingActivity.text}
                    onChange={e => onChangeEdit({ ...editingActivity, text: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === "Enter") onSaveEdit()
                      if (e.key === "Escape") onCancelEdit()
                    }}
                  />
                  <button
                    onMouseDown={e => { e.preventDefault(); onSaveEdit() }}
                    aria-label="Save activity"
                    className="shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="text-foreground font-serif truncate cursor-text hover:text-primary transition-colors"
                    onClick={() => onStartEdit({ dimId: dimension.id, actId: act.id, text: act.text })}
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
                onClick={() => onTogglePriority(act.id)}
                className={`p-1 h-auto transition-opacity ${act.isWeeklyPriority ? "text-accent" : "text-muted-foreground hover:text-accent opacity-0 group-hover:opacity-100"}`}
                title={act.isWeeklyPriority ? "Remove weekly priority" : "Mark as weekly priority"}
              >
                <Star className={`w-4 h-4 ${act.isWeeklyPriority ? "fill-accent" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteActivity(act.id)}
                title="Delete activity"
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
          placeholder={`Add a ${dimension.label.toLowerCase()} activity...`}
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") onAddActivity() }}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
        <Button onClick={onAddActivity} aria-label={`Add ${dimension.label} activity`} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
