"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedSchedule } from "@/components/animated-schedule"
import { CTA_HREF } from "../_constants/landing"

export function HeroSection() {
  return (
    <section className="relative z-10 px-6 py-24 md:py-24 lg:min-h-screen lg:py-0 lg:flex lg:items-center">
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-secondary-foreground mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-sm font-medium">Based on Stephen Covey&apos;s Framework</span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            <span className="text-balance">Plan Your Week Like a</span>{" "}
            <span className="text-primary">Highly Effective</span>{" "}
            <span className="text-accent">Person</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 font-serif leading-relaxed max-w-xl">
            Transform your productivity with the proven 7 Habits framework. Define goals, prioritize tasks, and export your perfect schedule to Google Calendar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-purple-700 hover:bg-primary/80 text-primary-foreground font-bold rounded-full px-8 py-6 text-lg group"
              asChild
            >
              <Link href={CTA_HREF}>
                Start Planning Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-secondary text-foreground hover:bg-secondary/20 rounded-full px-8 py-6 text-lg"
            >
              Watch Demo
            </Button>
          </div>
        </motion.div>

        {/* Right - Animated Schedule */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <AnimatedSchedule />
        </motion.div>
      </div>
    </section>
  )
}
