"use client"

import { Plus } from "lucide-react"

interface Props {
  onClick: () => void
}

export function AddRoleTile({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="p-8 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3 group"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <Plus className="w-7 h-7 text-primary" />
      </div>
      <span className="text-lg font-bold text-muted-foreground group-hover:text-foreground transition-colors">Add New Role</span>
    </button>
  )
}
