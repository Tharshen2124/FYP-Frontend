"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Moon, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { AppNav } from "@/components/app-nav"
import { OnboardingStepper } from "@/components/onboarding-stepper"
import { PlanComparison } from "@/components/plan-comparison"
import { api, type ApiPlan } from "@/lib/api"
import { useAuthStore } from "@/stores/auth-store"

export default function OnboardingCompletePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [plan, setPlan] = useState<ApiPlan | null>(null)

  // Only for the price on the Premium card. A failure is silent: this is the last screen of
  // onboarding, and a toast about a pricing figure would be a poor note to end on.
  useEffect(() => {
    let cancelled = false
    api
      .fetchSubscription()
      .then(({ plan: fetched }) => {
        if (!cancelled) setPlan(fetched)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  /** Marks the account onboarded. Both ways off this page go through it, for the reason below. */
  const finishOnboarding = async () => {
    await api.completeOnboarding()
    useAuthStore.getState().markOnboarded()
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      await finishOnboarding()
      router.push("/dashboard")
    } catch {
      toast.error("Couldn't finish onboarding — please try again.")
      setIsSubmitting(false)
    }
  }

  /*
   * Onboarding is finished *before* the browser leaves for Stripe, and the order is load-bearing.
   * Checkout navigates off the app entirely and comes back to /subscription, which sits outside the
   * onboarding flow — so an account that left from here still un-onboarded would never be marked,
   * and its next sign-in would drop the user back at step 1 with a week already planned.
   *
   * It is also why upgrading is a button here rather than a sixth step: `app/onboarding/layout.tsx`
   * turns away anyone who arrives already onboarded, so a step placed after that flag is set would
   * bounce straight to the dashboard.
   */
  const handleUpgrade = async () => {
    setIsSubmitting(true)
    try {
      await finishOnboarding()
      const { url } = await api.createCheckoutSession()
      window.location.assign(url)
    } catch {
      toast.error("Couldn't start checkout — please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav action="next" nextEnabled={!isSubmitting} onNext={handleComplete} />

      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <OnboardingStepper currentStep={5} />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              You&apos;re <span className="text-primary">Set!</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              Your weekly plan is ready. Here are two habits that will help you stay on track each day.
            </p>
          </div>

          {/* Two cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Evening Reflection card */}
            <div className="p-6 rounded-2xl bg-card border-2 border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Moon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Evening Reflection</h2>
              </div>
              <p className="text-muted-foreground font-serif leading-relaxed mb-4">
                At the end of each day, take a few minutes to write a brief reflection. What went well?
                What challenged you? How did you live your roles? Your reflections build self-awareness over time.
              </p>
              <p className="text-sm font-medium text-foreground">
                Access from the dashboard under{" "}
                <span className="text-primary">Evening Reflections</span>.
              </p>
            </div>

            {/* End-of-Day Check-in card */}
            <div className="p-6 rounded-2xl bg-card border-2 border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-xl font-bold text-foreground">End-of-Day Check-in</h2>
              </div>
              <p className="text-muted-foreground font-serif leading-relaxed mb-4">
                Each day at a time you choose, a modal will appear on the dashboard prompting you to mark
                which tasks you completed and write a short evening reflection. This daily check-in keeps
                your progress accurate and feeds your weekly analytics.
              </p>
              <p className="text-sm font-medium text-foreground">
                Set your check-in time under{" "}
                <span className="text-primary">Settings</span>.
              </p>
            </div>
          </div>

          {/* The upgrade offer sits here rather than interrupting the flow: onboarding is finished
              either way, and Next remains the plain way on to the dashboard. */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-1">Choose your plan</h2>
            <p className="text-muted-foreground font-serif mb-4">
              Everything you have just set up works on the Free plan. Premium adds the parts that only
              pay off over time.
            </p>
            <PlanComparison
              currentPlan="free"
              plan={plan}
              onUpgrade={handleUpgrade}
              isBusy={isSubmitting}
            />
          </section>

          <p className="text-center text-muted-foreground font-serif">
            Both features are always accessible from your dashboard. Click{" "}
            <span className="font-bold text-foreground">Next</span> to start on the Free plan — you can
            upgrade any time from <span className="text-primary">Subscription</span>.
          </p>
        </div>
      </main>
    </div>
  )
}
