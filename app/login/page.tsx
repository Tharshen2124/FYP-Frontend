"use client"

import { useState } from "react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import Link from "next/link"
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Floating task cards for background animation
const floatingTasks = [
  { id: 1, text: "Morning meditation", color: "#B13BFF", delay: 0 },
  { id: 2, text: "Team standup", color: "#FFCC00", delay: 1.5 },
  { id: 3, text: "Deep work session", color: "#471396", delay: 3 },
  { id: 4, text: "Exercise routine", color: "#B13BFF", delay: 4.5 },
  { id: 5, text: "Weekly review", color: "#FFCC00", delay: 6 },
  { id: 6, text: "Family time", color: "#471396", delay: 7.5 },
]

// Google icon component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

// Animated background component
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/30 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/10 blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating task cards */}
      {floatingTasks.map((task) => (
        <motion.div
          key={task.id}
          className="absolute px-4 py-2 rounded-xl text-sm font-medium text-white whitespace-nowrap"
          style={{
            backgroundColor: task.color,
            left: `${10 + (task.id * 15) % 70}%`,
            top: `${10 + (task.id * 20) % 80}%`,
          }}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{
            opacity: [0, 0.6, 0.6, 0],
            y: [20, -100, -150, -200],
            scale: [0.8, 1, 1, 0.9],
            rotate: [-5, 5, -3, 0],
          }}
          transition={{
            duration: 8,
            delay: task.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {task.text}
        </motion.div>
      ))}

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#B13BFF 1px, transparent 1px), linear-gradient(90deg, #B13BFF 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  )
}

// Animated checkmark component
function AnimatedCheckmark() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center justify-center w-6 h-6 rounded-full bg-accent"
    >
      <CheckCircle2 className="w-4 h-4 text-accent-foreground" />
    </motion.div>
  )
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Password strength indicator
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { strength: 0, label: "" }
    if (pass.length < 6) return { strength: 1, label: "Weak" }
    if (pass.length < 10) return { strength: 2, label: "Medium" }
    if (pass.length >= 10 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) {
      return { strength: 3, label: "Strong" }
    }
    return { strength: 2, label: "Medium" }
  }

  const passwordInfo = getPasswordStrength(password)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />

      {/* Main Card */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Card with glow effect */}
        <div className="relative">
          {/* Glow border */}
          <motion.div
            className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary opacity-70 blur-sm"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: "200% 200%" }}
          />
          
          {/* Card content */}
          <div className="relative bg-card rounded-3xl p-8 border-2 border-border">
            {/* Logo */}
            <motion.div
              className="flex items-center justify-center gap-2 mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link href="/" className="flex items-center gap-2">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="w-7 h-7 text-primary-foreground" />
                </motion.div>
                <span className="text-2xl font-bold text-foreground">HabitFlow</span>
              </Link>
            </motion.div>

            {/* Tab Switcher */}
            <LayoutGroup id="tabs">
              <motion.div
                className="flex bg-muted rounded-2xl p-1 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                layout={false}
              >
                <button
                  onClick={() => setIsLogin(true)}
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
                  onClick={() => setIsLogin(false)}
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

            {/* Header Text */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login" : "signup"}
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                className="text-center mb-8"
              >
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {isLogin ? "Welcome Back!" : "Create Account"}
                </h1>
                <p className="text-muted-foreground font-serif">
                  {isLogin
                    ? "Sign in to continue your productivity journey"
                    : "Start your journey to becoming highly effective"}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Google Sign In (login only) */}
            {isLogin && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  variant="outline"
                  className="w-full py-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/50 transition-all duration-300 group"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <GoogleIcon className="w-5 h-5 mr-3" />
                  </motion.div>
                  <span className="font-bold">Continue with Google</span>
                </Button>
              </motion.div>
            )}

            {/* Divider (login only) */}
            {isLogin && (
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground font-serif">or continue with email</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <Label htmlFor="email" className="text-foreground font-bold">
                  Email Address
                </Label>
                <div className="relative">
                  <motion.div
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    animate={{
                      color: focusedField === "email" ? "#B13BFF" : "#b8b8ff",
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
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    className="pl-11 py-6 rounded-xl bg-muted border-2 border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
                  />
                  {email.includes("@") && email.includes(".") && (
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
                    <Label htmlFor="username" className="text-foreground font-bold">
                      Username
                    </Label>
                    <div className="relative">
                      <motion.div
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        animate={{
                          color: focusedField === "username" ? "#B13BFF" : "#b8b8ff",
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
                        onChange={(e) => setUsername(e.target.value)}
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
                  <Label htmlFor="password" className="text-foreground font-bold">
                    Password
                  </Label>
                  {isLogin && (
                    <button
                      type="button"
                      className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <motion.div
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    animate={{
                      color: focusedField === "password" ? "#B13BFF" : "#b8b8ff",
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
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="pl-11 pr-11 py-6 rounded-xl bg-muted border-2 border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <motion.div
                      initial={false}
                      animate={{ rotate: showPassword ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </motion.div>
                  </button>
                </div>

                {/* Password Strength Indicator (only for signup) */}
                <AnimatePresence>
                  {!isLogin && password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex gap-1">
                        {[1, 2, 3].map((level) => (
                          <motion.div
                            key={level}
                            className="h-1.5 flex-1 rounded-full"
                            initial={{ scaleX: 0 }}
                            animate={{
                              scaleX: 1,
                              backgroundColor:
                                passwordInfo.strength >= level
                                  ? level === 1
                                    ? "#ef4444"
                                    : level === 2
                                    ? "#FFCC00"
                                    : "#22c55e"
                                  : "#1a0080",
                            }}
                            transition={{ delay: level * 0.1 }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground font-serif">
                        Password strength:{" "}
                        <span
                          className={`font-bold ${
                            passwordInfo.strength === 1
                              ? "text-red-500"
                              : passwordInfo.strength === 2
                              ? "text-accent"
                              : "text-green-500"
                          }`}
                        >
                          {passwordInfo.label}
                        </span>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  type="submit"
                  className="w-full py-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg group relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </motion.div>
            </form>

            {/* Footer Text */}
            <motion.p
              className="text-center text-sm text-muted-foreground mt-8 font-serif"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary/80 font-bold transition-colors"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </motion.p>

          </div>
        </div>

        {/* Decorative elements */}
        <motion.div
          className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-accent/20 blur-xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-primary/20 blur-xl"
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </motion.div>
    </div>
  )
}
