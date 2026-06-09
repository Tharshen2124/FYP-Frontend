"use client"

import { useState } from "react"
import { Plus, Sparkles, X, Flame, Brain, Users } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Activity {
  id: string
  text: string
}

interface Dimension {
  id: string
  label: string
  description: string
  icon: React.ElementType
  color: string
  activities: Activity[]
}

const INITIAL_DIMENSIONS: Dimension[] = [
  {
    id: "physical",
    label: "Physical",
    description: "Exercise, nutrition, rest, and stress management",
    icon: Flame,
    color: "#f97316",
    activities: [],
  },
  {
    id: "spiritual",
    label: "Spiritual",
    description: "Clarifying values, meditation, reflection, and service",
    icon: Sparkles,
    color: "#B13BFF",
    activities: [],
  },
  {
    id: "mental",
    label: "Mental",
    description: "Reading, learning, writing, and creative thinking",
    icon: Brain,
    color: "#14b8a6",
    activities: [],
  },
  {
    id: "social",
    label: "Social / Emotional",
    description: "Meaningful relationships, empathy, and contribution",
    icon: Users,
    color: "#FFCC00",
    activities: [],
  },
]

export default function SharpenTheSawPage() {
  const [dimensions, setDimensions] = useState<Dimension[]>(INITIAL_DIMENSIONS)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<{ dimId: string; actId: string } | null>(null)
  const [editText, setEditText] = useState("")

  const addActivity = (dimId: string) => {
    const text = (inputs[dimId] || "").trim()
    if (!text) return
    setDimensions(prev =>
      prev.map(d =>
        d.id === dimId
          ? { ...d, activities: [...d.activities, { id: Date.now().toString(), text }] }
          : d
      )
    )
    setInputs(prev => ({ ...prev, [dimId]: "" }))
  }

  const deleteActivity = (dimId: string, actId: string) => {
    setDimensions(prev =>
      prev.map(d =>
        d.id === dimId
          ? { ...d, activities: d.activities.filter(a => a.id !== actId) }
          : d
      )
    )
  }

  const startEdit = (dimId: string, actId: string, text: string) => {
    setEditingId({ dimId, actId })
    setEditText(text)
  }

  const commitEdit = () => {
    if (!editingId || !editText.trim()) { setEditingId(null); return }
    setDimensions(prev =>
      prev.map(d =>
        d.id === editingId.dimId
          ? { ...d, activities: d.activities.map(a => a.id === editingId.actId ? { ...a, text: editText.trim() } : a) }
          : d
      )
    )
    setEditingId(null)
    setEditText("")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      <main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
            Sharpen the <span className="text-primary">Saw</span>
          </h1>
          <p className="text-muted-foreground font-serif">
            Manage your renewal activities across the four dimensions of life.
          </p>
        </div>

        <div className="grid gap-6">
          {dimensions.map(dim => {
            const Icon = dim.icon
            return (
              <div key={dim.id} className="p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/30 transition-colors">
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
                    <div key={act.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 group">
                      {editingId?.dimId === dim.id && editingId?.actId === act.id ? (
                        <Input
                          autoFocus
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => {
                            if (e.key === "Enter") commitEdit()
                            if (e.key === "Escape") setEditingId(null)
                          }}
                          className="bg-muted border-border text-foreground h-8 py-0 mr-2"
                        />
                      ) : (
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dim.color }} />
                          <span className="text-foreground font-serif truncate cursor-pointer hover:text-primary transition-colors" onClick={() => startEdit(dim.id, act.id, act.text)}>
                            {act.text}
                          </span>
                        </div>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => deleteActivity(dim.id, act.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity flex-shrink-0">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder={`Add a ${dim.label.toLowerCase()} activity...`}
                    value={inputs[dim.id] || ""}
                    onChange={e => setInputs(prev => ({ ...prev, [dim.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") addActivity(dim.id) }}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                  <Button onClick={() => addActivity(dim.id)} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
