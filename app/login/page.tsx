"use client"

import { useState } from "react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import Link from "next/link"
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AnimatedBackground } from "./_components/animated-background"
import { AnimatedCheckmark } from "./_components/animated-checkmark"
import { GoogleIcon } from "./_components/google-icon"

function getPasswordStrength(pass: string) {
  if (pass.length === 0) return { strength: 0, label: "" }
  if (pass.length < 6) return { strength: 1, label: "Weak" }
  if (pass.length < 10) return { strength: 2, label: "Medium" }
  if (pass.length >= 10 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) return { strength: 3, label: "Strong" }
  return { strength: 2, label: "Medium" }
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const passwordInfo = getPasswordStrength(password)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="relative">
          <motion.div
            className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary opacity-70 blur-sm"
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: "200% 200%" }}
          />

          <div className="relative bg-card rounded-3xl p-8 border-2 border-border">
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
                  className={`relative flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-colors ${isLogin ? "text-foreground" : "text-muted-foreground"}`}
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
                  className={`relative flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-colors ${!isLogin ? "text-foreground" : "text-muted-foreground"}`}
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
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Button
                  variant="outline"
                  className="w-full py-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/50 transition-all duration-300 group"
                >
                  <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                    <GoogleIcon className="w-5 h-5 mr-3" />
                  </motion.div>
                  <span className="font-bold">Continue with Google</span>
                </Button>
              </motion.div>
            )}

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
            <form className="space-y-5" onSubmit={e => e.preventDefault()}>
              {/* Email */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-bold">Email Address</Label>
                <div className="relative">
                  <motion.div
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    animate={{ color: focusedField === "email" ? "#B13BFF" : "#b8b8ff", scale: focusedField === "email" ? 1.1 : 1 }}
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
                  {email.includes("@") && email.includes(".") && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AnimatedCheckmark />
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Username (signup only) */}
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
                        animate={{ color: focusedField === "username" ? "#B13BFF" : "#b8b8ff", scale: focusedField === "username" ? 1.1 : 1 }}
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

              {/* Password */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-2">
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
                    animate={{ color: focusedField === "password" ? "#B13BFF" : "#b8b8ff", scale: focusedField === "password" ? 1.1 : 1 }}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <motion.div initial={false} animate={{ rotate: showPassword ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </motion.div>
                  </button>
                </div>

                {/* Password Strength (signup only) */}
                <AnimatePresence>
                  {!isLogin && password.length > 0 && (
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
                              backgroundColor:
                                passwordInfo.strength >= level
                                  ? level === 1 ? "#ef4444" : level === 2 ? "#FFCC00" : "#22c55e"
                                  : "#1a0080",
                            }}
                            transition={{ delay: level * 0.1 }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground font-serif">
                        Password strength:{" "}
                        <span className={`font-bold ${passwordInfo.strength === 1 ? "text-red-500" : passwordInfo.strength === 2 ? "text-accent" : "text-green-500"}`}>
                          {passwordInfo.label}
                        </span>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Submit */}
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

            <motion.p
              className="text-center text-sm text-muted-foreground mt-8 font-serif"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:text-primary/80 font-bold transition-colors">
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </motion.p>
          </div>
        </div>

        <motion.div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-accent/20 blur-xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity }} />
        <motion.div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-primary/20 blur-xl" animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 4, repeat: Infinity }} />
      </motion.div>
    </div>
  )
}
