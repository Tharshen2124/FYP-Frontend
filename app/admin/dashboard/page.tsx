"use client"

import { Loader2 } from "lucide-react"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { AdminDenied } from "./_components/admin-denied"
import { AdminHeader } from "./_components/admin-header"
import { MetricCards } from "./_components/metric-cards"
import { PaymentTable } from "./_components/payment-table"
import { RevenueChart } from "./_components/revenue-chart"
import { SubscriptionBreakdown } from "./_components/subscription-breakdown"
import { UserTable } from "./_components/user-table"
import { useAdminDashboard } from "./_utils/use-admin"

export default function AdminDashboardPage() {
  const { isReady } = useRequireAuth()
  const admin = useAdminDashboard(isReady)

  if (!isReady) return null

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      {/* Its own header rather than the app `<Sidebar>`: an admin account does not run a week, so
          every link in that nav leads somewhere middleware.ts turns it straight back from. */}
      <AdminHeader />

      <main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">
        {/* Rendered before the data arrives on purpose: every route in this app is asserted to show
            its heading immediately by tests/e2e/app-navigation.spec.ts. */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
            <span className="text-primary">Admin</span> Dashboard
          </h1>
          <p className="text-muted-foreground font-serif">
            Who is using HabitFlow, and what they have paid for it.
          </p>
        </div>

        {admin.denied ? (
          /* The heading and the sidebar stay: this is the page answering, not a redirect. */
          <AdminDenied />
        ) : admin.isLoading || !admin.overview ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-serif">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading the dashboard…
          </div>
        ) : (
          <div className="space-y-6">
            <MetricCards overview={admin.overview} />

            {/* The trend takes two thirds: it is the figure with thirteen values, and the
                breakdown beside it has three or four rows. */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RevenueChart revenue={admin.overview.revenue} />
              </div>
              <SubscriptionBreakdown overview={admin.overview} />
            </div>

            <UserTable
              list={admin.users}
              search={admin.search}
              onSearchChange={admin.setSearch}
              filter={admin.userFilter}
              onFilterChange={admin.setUserFilter}
              bannedCount={admin.overview.users.banned}
              onBanChange={admin.setUserBanned}
            />

            <PaymentTable
              list={admin.payments}
              filter={admin.paymentFilter}
              onFilterChange={admin.setPaymentFilter}
              failedCount={admin.overview.revenue.failed_count}
            />
          </div>
        )}
      </main>
    </div>
  )
}
