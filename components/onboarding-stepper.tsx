"use client"

import { Check } from "lucide-react"

const STEPS = [
  { index: 1, label: "Roles & Goals" },
  { index: 2, label: "Sharpen the Saw" },
  { index: 3, label: "Fixed Appointments" },
  { index: 4, label: "Schedule Tasks" },
  { index: 5, label: "You're Set!" },
]

interface OnboardingStepperProps {
  currentStep: 1 | 2 | 3 | 4 | 5
}

export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  return (
    <div className="flex items-start mb-8">
      {STEPS.map((step, idx) => {
        const isComplete = step.index < currentStep
        const isActive   = step.index === currentStep
        const isFuture   = step.index > currentStep

        return (
          <div key={step.index} className="flex items-start flex-1">
            {/* Step item */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  isComplete
                    ? "bg-primary text-primary-foreground"
                    : isActive
                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "bg-muted text-muted-foreground border-2 border-border",
                ].join(" ")}
              >
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.index
                )}
              </div>
              <span
                className={[
                  "hidden sm:block text-xs font-medium text-center leading-tight max-w-[80px]",
                  isFuture ? "text-muted-foreground" : "text-foreground",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {idx < STEPS.length - 1 && (
              <div
                className={[
                  "flex-1 h-0.5 mt-4 mx-2 transition-colors",
                  isComplete ? "bg-primary" : "bg-border",
                ].join(" ")}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
