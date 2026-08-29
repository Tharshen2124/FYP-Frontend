import { TONE_COLORS } from "../_constants/admin"
import { humanStatus, share, subscriptionTone } from "../_utils/format"
import type { AdminOverview } from "../_types"

/**
 * Every Stripe subscription status on the books, largest first.
 *
 * A list with proportional bars rather than a pie: there are usually two or three statuses, one of
 * them holding almost everything, and a pie of that is a circle with a sliver in it. The bars are
 * read against each other and the counts are right there, which a pie makes you infer from angles.
 *
 * The statuses come from the server as Stripe wrote them, so one nobody anticipated shows up under
 * its own name in neutral grey rather than being dropped from a list of the ones we expected —
 * `past_due` and `unpaid` are exactly what this card is for.
 */
export function SubscriptionBreakdown({ overview }: { overview: AdminOverview }) {
  const { by_status: byStatus, premium, ever_subscribed: everSubscribed } = overview.subscriptions
  const rows = Object.entries(byStatus).sort(([, a], [, b]) => b - a)
  const total = rows.reduce((sum, [, count]) => sum + count, 0)
  // Everyone who paid at some point and is not paying now. The figure the premium count cannot
  // give on its own, and the reason `ever_subscribed` is reported at all.
  const lapsed = Math.max(everSubscribed - premium, 0)

  return (
    <section
      aria-label="Subscription states"
      className="p-6 rounded-2xl bg-card border-2 border-border h-full"
    >
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">Subscription States</h2>
        <p className="text-xs text-muted-foreground font-serif mt-0.5">
          As Stripe reports them, across every account
        </p>
      </div>

      {rows.length > 0 ? (
        <>
          <ul className="space-y-3">
            {rows.map(([status, count]) => {
              const tone = subscriptionTone(status)
              return (
                <li key={status}>
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <span className="text-sm text-foreground">{humanStatus(status)}</span>
                    <span className="text-sm font-bold text-foreground tabular-nums shrink-0">
                      {count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${share(count, total)}%`,
                        backgroundColor: TONE_COLORS[tone],
                      }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="flex items-baseline justify-between gap-3 mt-4 pt-4 border-t border-border">
            <span className="text-sm text-muted-foreground font-serif">Lapsed</span>
            <span className="text-sm font-bold text-foreground tabular-nums">
              {lapsed.toLocaleString()}
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-serif text-center px-4">
          Nobody has subscribed yet.
        </div>
      )}
    </section>
  )
}
