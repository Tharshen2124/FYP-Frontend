"use client"

import { motion, LayoutGroup } from "framer-motion"

interface Props {
  isLogin: boolean
  onChange: (isLogin: boolean) => void
}

export function AuthTabs({ isLogin, onChange }: Props) {
  return (
    <LayoutGroup id="tabs">
      <motion.div
        className="flex bg-muted rounded-2xl p-1 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        layout={false}
      >
        <button
          onClick={() => onChange(true)}
          className={`relative flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-colors ${
            isLogin ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {isLogin && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-secondary rounded-xl"
              layout="position"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">Sign In</span>
        </button>
        <button
          onClick={() => onChange(false)}
          className={`relative flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-colors ${
            !isLogin ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {!isLogin && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-secondary rounded-xl"
              layout="position"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">Sign Up</span>
        </button>
      </motion.div>
    </LayoutGroup>
  )
}
