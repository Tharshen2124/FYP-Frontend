"use client"

import { Moon, CheckCircle2 } from "lucide-react"
import { AppNav } from "@/components/app-nav"
import { OnboardingStepper } from "@/components/onboarding-stepper"

export default function OnboardingCompletePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav action="next" nextHref="/dashboard" nextEnabled={true} />

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

            {/* Mark Completed Tasks card */}
            <div className="p-6 rounded-2xl bg-card border-2 border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Mark Completed Tasks</h2>
              </div>
              <p className="text-muted-foreground font-serif leading-relaxed mb-4">
                After completing a scheduled task, mark it as done in your weekly schedule. Tracking your
                completions helps you see your progress and feeds your weekly analytics.
              </p>
              <p className="text-sm font-medium text-foreground">
                Access from the dashboard under{" "}
                <span className="text-primary">Schedule</span>.
              </p>
            </div>
          </div>

          <p className="text-center text-muted-foreground font-serif">
            Both features are always accessible from your dashboard. Click{" "}
            <span className="font-bold text-foreground">Next</span> to get started.
          </p>
        </div>
      </main>
    </div>
  )
}
