"use client"

import { motion } from "framer-motion"
import type { PasswordInfo } from "../_types"

const LEVEL_COLORS = ["#ef4444", "#FFCC00", "#22c55e"]
const EMPTY_COLOR = "#1a0080"

export function PasswordStrengthMeter({ info }: { info: PasswordInfo }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-2"
    >
      <div className="flex gap-1">
        {[1, 2, 3].map(level => (
          <motion.div
            key={level}
            className="h-1.5 flex-1 rounded-full"
            initial={{ scaleX: 0 }}
            animate={{
              scaleX: 1,
              backgroundColor: info.strength >= level ? LEVEL_COLORS[level - 1] : EMPTY_COLOR,
            }}
            transition={{ delay: level * 0.1 }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground font-serif">
        Password strength:{" "}
        <span
          className={`font-bold ${
            info.strength === 1 ? "text-red-500" : info.strength === 2 ? "text-accent" : "text-green-500"
          }`}
        >
          {info.label}
        </span>
      </p>
    </motion.div>
  )
}
