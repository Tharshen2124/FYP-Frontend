"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Radix renders `data-state="checked" | "unchecked"`, so every stateful style here has to hang off
// `data-[state=...]`, the way every other Radix-backed component in components/ui does. An earlier
// version styled `data-checked:` / `data-unchecked:` instead, which Tailwind compiles to
// `[data-checked]` -- an attribute Radix never sets. The track colour and the thumb's travel both
// silently did nothing, leaving a thumb that never moved on a track that was never painted.
//
// The off track is `bg-input` (#1a0080) on a `bg-card` (#130066) surface, which is nearly the same
// colour, so the border is what makes it read as a track at all rather than decoration.
function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        // `after:` widens the hit area past the drawn control without moving anything around it.
        "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors outline-none after:absolute after:-inset-x-3 after:-inset-y-2",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "data-[size=default]:h-7 data-[size=default]:w-12 data-[size=sm]:h-6 data-[size=sm]:w-10",
        "data-[state=unchecked]:border-border data-[state=unchecked]:bg-input",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-foreground shadow-sm ring-0 transition-transform",
          "group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-4",
          // Travel is the track's content box less the thumb: 48 - 4 border - 20 thumb = 24px, and
          // 40 - 4 - 16 = 20px for sm. Hard-coded because a percentage translate measures the thumb.
          "data-[state=unchecked]:translate-x-0",
          "group-data-[size=default]/switch:data-[state=checked]:translate-x-6",
          "group-data-[size=sm]/switch:data-[state=checked]:translate-x-5"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
