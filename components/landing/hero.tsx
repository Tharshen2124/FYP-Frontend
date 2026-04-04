"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export function Hero() {
  const [dragPhase, setDragPhase] = useState(0);

  // Animation cycle: 0 = top position, 1 = dragging down, 2 = bottom position, 3 = dragging up
  useEffect(() => {
    const interval = setInterval(() => {
      setDragPhase((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const isAtBottom = dragPhase === 2 || dragPhase === 3;
  const isDragging = dragPhase === 1 || dragPhase === 3;

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-secondary/30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-accent/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full text-sm font-medium text-primary mb-6">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Based on The 7 Habits Framework
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
              Plan your week around{" "}
              <span className="text-primary">what matters most</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 text-pretty">
              Transform how you schedule your life. Define your goals, organize
              tasks by importance, nurture your well-being, and sync everything
              seamlessly with Google Calendar.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="gap-2">
                Start Planning Free
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                Watch Demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center gap-6 justify-center lg:justify-start text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                Free 14-day trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                Google Calendar sync
              </div>
            </div>
          </div>

          {/* Right Content - App Preview */}
          <div className="relative">
            <div className="relative bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
              {/* Mock App Header */}
              <div className="bg-primary/5 px-6 py-4 border-b border-border flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center text-sm font-medium text-muted-foreground">
                  Weekly Planner
                </div>
              </div>

              {/* Mock Calendar Grid */}
              <div className="p-6">
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-medium text-muted-foreground py-2"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* Mock Tasks with Animation */}
                <div className="relative flex flex-col gap-3">
                  {/* Draggable Task - Q2 Strategy Planning */}
                  <div
                    className={`
                      relative z-10 flex items-center gap-3 p-3 bg-primary/10 rounded-lg border-l-4 border-primary
                      transition-all duration-1000 ease-in-out
                      ${isDragging ? "shadow-xl scale-[1.02] ring-2 ring-primary/30" : "shadow-none scale-100"}
                      ${isAtBottom ? "translate-y-[136px]" : "translate-y-0"}
                    `}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        Q2 Strategy Planning
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Quadrant II - Important
                      </div>
                    </div>
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      Goal
                    </span>
                  </div>

                  {/* Static Task - Morning Meditation */}
                  <div
                    className={`
                      flex items-center gap-3 p-3 bg-accent/10 rounded-lg border-l-4 border-accent
                      transition-all duration-1000 ease-in-out
                      ${isAtBottom ? "-translate-y-[80px]" : "translate-y-0"}
                    `}
                  >
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        Morning Meditation
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Sharpen the Saw - Mental
                      </div>
                    </div>
                    <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                      Wellness
                    </span>
                  </div>

                  {/* Static Task - Team Weekly Sync */}
                  <div
                    className={`
                      flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border-l-4 border-secondary
                      transition-all duration-1000 ease-in-out
                      ${isAtBottom ? "-translate-y-[80px]" : "translate-y-0"}
                    `}
                  >
                    <div className="w-2 h-2 rounded-full bg-secondary-foreground/50" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        Team Weekly Sync
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Linked to: Q2 Strategy
                      </div>
                    </div>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                      Task
                    </span>
                  </div>

                  {/* Animated Cursor */}
                  <div
                    className={`
                      absolute pointer-events-none z-20
                      transition-all duration-1000 ease-in-out
                      ${isDragging ? "opacity-100" : "opacity-0"}
                      ${isAtBottom ? "top-[195px]" : "top-7"}
                      right-8
                    `}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="drop-shadow-lg"
                    >
                      <path
                        d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
                        fill="#091413"
                        stroke="#B0E4CC"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                </div>

                {/* Drag indicator */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <svg
                    className="w-4 h-4 animate-bounce"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                  Drag & drop to schedule
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-card p-4 rounded-xl shadow-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Synced</div>
                  <div className="text-xs text-muted-foreground">
                    Google Calendar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
