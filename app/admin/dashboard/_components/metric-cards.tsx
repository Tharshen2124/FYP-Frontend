import { Users, Activity, Crown, Banknote } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { money, percentLabel } from "../_utils/format"
import type { AdminOverview } from "../_types"

interface Card {
  label: string
  value: string
  /** The line under the figure. Always says what the figure *excludes*, not just more numbers. */
  detail: string
  icon: LucideIcon
}

/**
 * The four figures the page opens with.
 *
 * Each is a **stat tile, not a chart**: one number whose job is to be read, with a second line
 * giving it the context it needs to mean anything. "142 accounts" alone cannot say whether that is
 * growth or a plateau, so every tile carries the qualifier a bare count leaves out.
 */
function cards(overview: AdminOverview): Card[] {
  const { users, subscriptions, revenue } = overview

  return [
    {
      label: "Accounts",
      value: users.total.toLocaleString(),
      detail: `${users.onboarded.toLocaleString()} onboarded · ${users.new_recently.toLocaleString()} new in 30 days`,
      icon: Users,
    },
    {
      label: "Active",
      value: users.active_recently.toLocaleString(),
      // Spelled out because "active" is a definition, not an observation: signing in is not the
      // signal here — the token lives seven days, so an account can be signed in all week without
      // the app having been opened once.
      detail: `${percentLabel(users.active_recently, users.total)} touched a task in 30 days`,
      icon: Activity,
    },
    {
      label: "Premium",
      value: subscriptions.premium.toLocaleString(),
      detail: `${percentLabel(subscriptions.premium, users.total)} of accounts · ${subscriptions.ever_subscribed.toLocaleString()} ever subscribed`,
      icon: Crown,
    },
    {
      label: "Revenue",
      value: money(revenue.total_cents, revenue.currency),
      detail: revenue.currency
        ? `${money(revenue.recent_cents, revenue.currency)} in the last 30 days`
        : "No payments recorded yet",
      icon: Banknote,
    },
  ]
}

export function MetricCards({ overview }: { overview: AdminOverview }) {
  return (
    <section
      aria-label="Key metrics"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
    >
      {cards(overview).map(({ label, value, detail, icon: Icon }) => (
        <div key={label} className="p-5 rounded-2xl bg-card border-2 border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" aria-hidden />
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              {label}
            </p>
          </div>
          <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground font-serif mt-1 leading-snug">{detail}</p>
        </div>
      ))}
    </section>
  )
}
