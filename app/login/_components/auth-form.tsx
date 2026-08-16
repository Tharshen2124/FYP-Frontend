"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { POST_AUTH_HREF } from "../_constants/auth"
import { getPasswordStrength, isValidEmail } from "../_utils/password"
import { AnimatedCheckmark } from "./animated-checkmark"
import { PasswordStrengthMeter } from "./password-strength-meter"
import type { FocusedField } from "../_types"

const FOCUS_COLOR = "#B13BFF"
const IDLE_COLOR = "#b8b8ff"

interface Props {
  isLogin: boolean
}

export function AuthForm({ isLogin }: Props) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [focusedField, setFocusedField] = useState<FocusedField>(null)

  const passwordInfo = getPasswordStrength(password)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // No auth backend yet — send the user straight into onboarding.
    router.push(POST_AUTH_HREF)
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* Email Field */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-2"
      >
        <Label htmlFor="email" className="text-foreground font-bold">Email Address</Label>
        <div className="relative">
          <motion.div
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            animate={{
              color: focusedField === "email" ? FOCUS_COLOR : IDLE_COLOR,
              scale: focusedField === "email" ? 1.1 : 1,
            }}
          >
            <Mail className="w-5 h-5" />
          </motion.div>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            className="pl-11 py-6 rounded-xl bg-muted border-2 border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
          {isValidEmail(email) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AnimatedCheckmark />
            </div>
          )}
        </div>
      </motion.div>

      {/* Username Field (sign up only) */}
      <AnimatePresence>
        {!isLogin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2 overflow-hidden"
          >
            <Label htmlFor="username" className="text-foreground font-bold">Username</Label>
            <div className="relative">
              <motion.div
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                animate={{
                  color: focusedField === "username" ? FOCUS_COLOR : IDLE_COLOR,
                  scale: focusedField === "username" ? 1.1 : 1,
                }}
              >
                <User className="w-5 h-5" />
              </motion.div>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                className="pl-11 py-6 rounded-xl bg-muted border-2 border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
              />
              {username.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AnimatedCheckmark />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Field */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-foreground font-bold">Password</Label>
          {isLogin && (
            <button type="button" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
              Forgot password?
            </button>
          )}
        </div>
        <div className="relative">
          <motion.div
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            animate={{
              color: focusedField === "password" ? FOCUS_COLOR : IDLE_COLOR,
              scale: focusedField === "password" ? 1.1 : 1,
            }}
          >
            <Lock className="w-5 h-5" />
          </motion.div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            className="pl-11 pr-11 py-6 rounded-xl bg-muted border-2 border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <motion.div initial={false} animate={{ rotate: showPassword ? 180 : 0 }} transition={{ duration: 0.2 }}>
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </motion.div>
          </button>
        </div>

        {/* Password Strength Indicator (only for signup) */}
        <AnimatePresence>
          {!isLogin && password.length > 0 && <PasswordStrengthMeter info={passwordInfo} />}
        </AnimatePresence>
      </motion.div>

      {/* Submit Button */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Button
          type="submit"
          className="w-full py-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg group relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLogin ? "Sign In" : "Create Account"}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Button>
      </motion.div>
    </form>
  )
}
