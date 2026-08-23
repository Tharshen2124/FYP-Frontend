"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useAuthStore } from "@/stores/auth-store"
import { AnimatedBackground } from "./_components/animated-background"
import { AuthTabs } from "./_components/auth-tabs"
import { AuthForm } from "./_components/auth-form"
import { GoogleIcon } from "./_components/google-icon"
import {
  ONBOARDING_HREF,
  DASHBOARD_HREF,
  OAUTH_ERROR_MESSAGES,
  OAUTH_ERROR_FALLBACK,
} from "./_constants/auth"

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)

  // Handles the return trip from the backend's Google OAuth callback, which
  // redirects here with either `#token=...` or `#error=...` in the URL hash.
  useEffect(() => {
    if (!window.location.hash) return
    const params = new URLSearchParams(window.location.hash.slice(1))
    const token = params.get("token")
    const error = params.get("error")

    if (token) {
      useAuthStore.getState().setAuthFromToken(token)
      window.history.replaceState(null, "", window.location.pathname)
      router.push(useAuthStore.getState().isOnboarded ? DASHBOARD_HREF : ONBOARDING_HREF)
    } else if (error) {
      toast.error(OAUTH_ERROR_MESSAGES[error] ?? OAUTH_ERROR_FALLBACK)
      window.history.replaceState(null, "", window.location.pathname)
    }
  }, [router])

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
        <div className="relative">
          {/* Glow border */}
          <motion.div
            className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary opacity-70 blur-sm"
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
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

            <AuthTabs isLogin={isLogin} onChange={setIsLogin} />

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

            {/* Google Sign In + divider (login only) */}
            {isLogin && (
              <>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Button
                    variant="outline"
                    asChild
                    className="w-full py-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/50 transition-all duration-300 group"
                  >
                    <a href={api.googleLoginHref()}>
                      <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                        <GoogleIcon className="w-5 h-5 mr-3" />
                      </motion.div>
                      <span className="font-bold">Continue with Google</span>
                    </a>
                  </Button>
                </motion.div>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-muted-foreground font-serif">or continue with email</span>
                  </div>
                </div>
              </>
            )}

            <AuthForm
              key={isLogin ? "login" : "signup"}
              isLogin={isLogin}
              onSignupSuccess={() => setIsLogin(true)}
            />

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
