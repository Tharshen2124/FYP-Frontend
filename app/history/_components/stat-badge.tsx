export function StatBadge({ value, label, icon }: { value: number; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
      <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground font-serif mt-0.5">{label}</p>
      </div>
    </div>
  )
}
