import { Sparkles } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="relative z-10 px-6 py-12 border-t border-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">HabitFlow</span>
        </div>

        <div className="flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Contact</a>
        </div>

        <p className="text-sm text-muted-foreground">
          2026 HabitFlow. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
