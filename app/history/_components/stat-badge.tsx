interface Props {
  value: string | number
  label: string
  /** A second figure the headline needs to be read against, e.g. "(67%)" under "12/18". */
  sublabel?: string
  icon: React.ReactNode
}

export function StatBadge({ value, label, sublabel, icon }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
      <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-foreground leading-none tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground font-serif mt-0.5 truncate">
          {label}
          {sublabel && <span className="ml-1 tabular-nums">{sublabel}</span>}
        </p>
      </div>
    </div>
  )
}
