"use client"

import { useState } from "react"
import { Plus, Sparkles, Star, X, Flame, Brain, Users, Check } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Activity {
  id: string
  text: string
  isWeeklyPriority?: boolean
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
  const [editingActivity, setEditingActivity] = useState<{ dimId: string; actId: string; text: string } | null>(null)
  const [activityToDelete, setActivityToDelete] = useState<{ dimId: string; activity: Activity } | null>(null)

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

  const togglePriority = (dimId: string, actId: string) => {
    setDimensions(prev =>
      prev.map(d =>
        d.id === dimId
          ? { ...d, activities: d.activities.map(a => a.id === actId ? { ...a, isWeeklyPriority: !a.isWeeklyPriority } : a) }
          : d
      )
    )
  }

  const handleDeleteActivity = (dimId: string, actId: string) => {
    const dim = dimensions.find(d => d.id === dimId)
    const activity = dim?.activities.find(a => a.id === actId)
    if (activity) setActivityToDelete({ dimId, activity })
  }

  const handleConfirmDeleteActivity = () => {
    if (activityToDelete) {
      setDimensions(prev =>
        prev.map(d =>
          d.id === activityToDelete.dimId
            ? { ...d, activities: d.activities.filter(a => a.id !== activityToDelete.activity.id) }
            : d
        )
      )
      setActivityToDelete(null)
    }
  }

  const handleSaveActivityEdit = () => {
    if (!editingActivity || !editingActivity.text.trim()) {
      setEditingActivity(null)
      return
    }
    setDimensions(prev =>
      prev.map(d =>
        d.id === editingActivity.dimId
          ? { ...d, activities: d.activities.map(a => a.id === editingActivity.actId ? { ...a, text: editingActivity.text.trim() } : a) }
          : d
      )
    )
    setEditingActivity(null)
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
                    <div key={act.id} className={`flex items-center justify-between p-3 rounded-xl group transition-colors ${act.isWeeklyPriority ? "bg-accent/10 border border-accent/30" : "bg-muted/50"}`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dim.color }} />
                        {editingActivity?.actId === act.id ? (
                          <>
                            <input
                              autoFocus
                              className="flex-1 bg-transparent text-foreground font-serif outline-none border-b border-primary"
                              value={editingActivity.text}
                              onChange={e => setEditingActivity({ ...editingActivity, text: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === "Enter") handleSaveActivityEdit()
                                if (e.key === "Escape") setEditingActivity(null)
                              }}
                            />
                            <button
                              onMouseDown={e => { e.preventDefault(); handleSaveActivityEdit() }}
                              className="shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5 text-primary-foreground" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-foreground font-serif truncate cursor-text hover:text-primary transition-colors" onClick={() => setEditingActivity({ dimId: dim.id, actId: act.id, text: act.text })}>
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
                          onClick={() => togglePriority(dim.id, act.id)}
                          className={`p-1 h-auto transition-opacity ${act.isWeeklyPriority ? "text-accent" : "text-muted-foreground hover:text-accent opacity-0 group-hover:opacity-100"}`}
                          title={act.isWeeklyPriority ? "Remove weekly priority" : "Mark as weekly priority"}
                        >
                          <Star className={`w-4 h-4 ${act.isWeeklyPriority ? "fill-accent" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteActivity(dim.id, act.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity flex-shrink-0 p-1 h-auto">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
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

      <AlertDialog open={!!activityToDelete} onOpenChange={(open) => { if (!open) setActivityToDelete(null) }}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
              <X className="w-6 h-6 text-destructive" />
              Delete Activity?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-serif">
              Are you sure you want to delete{" "}
              <span className="font-bold text-foreground">&ldquo;{activityToDelete?.activity.text}&rdquo;</span>?
              <br /><br />
              This activity may be linked to scheduled tasks. Deleting it will not remove those tasks, but they will lose their activity association.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setActivityToDelete(null)} className="border-border text-foreground hover:bg-secondary/20">Cancel</Button>
            <Button onClick={handleConfirmDeleteActivity} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Activity</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
