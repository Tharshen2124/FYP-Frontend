"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AppNavProps {
  /** Which action button to show on the right side */
  action?: "back" | "next"
  /** href to navigate to when Next is clicked (renders as a Link) */
  nextHref?: string
  /** Whether the Next button is enabled. Defaults to true. */
  nextEnabled?: boolean
  /** Called on Next click when there is no nextHref */
  onNext?: () => void
  /** href for the Back button. Falls back to router.back() if omitted. */
  backHref?: string
  /** Optional content rendered between the logo and the action button */
  extra?: React.ReactNode
}

export function AppNav({
  action,
  nextHref,
  nextEnabled = true,
  onNext,
  backHref,
  extra,
}: AppNavProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backHref) router.push(backHref)
    else router.back()
  }

  return (
    <nav className="relative z-10 px-6 py-4 border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">HabitFlow</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {extra}

          {action === "back" && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-border text-foreground hover:bg-secondary/20"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}

          {action === "next" && (
            nextEnabled && nextHref ? (
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-secondary/20"
                asChild
              >
                <Link href={nextHref}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled={!nextEnabled}
                onClick={nextEnabled ? onNext : undefined}
                className="border-border text-foreground hover:bg-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )
          )}
        </div>
      </div>
    </nav>
  )
}
