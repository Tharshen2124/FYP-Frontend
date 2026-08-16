"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CTA_HREF } from "../_constants/landing"

export function CtaSection() {
  return (
    <section className="relative z-10 px-6 py-24">
      <motion.div
        className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-secondary to-primary/50 border-2 border-primary/30"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="w-20 h-20 rounded-full bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-8"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className="w-10 h-10" />
        </motion.div>

        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Ready to Transform Your Productivity?
        </h2>
        <p className="text-lg text-muted-foreground font-serif mb-8 max-w-2xl mx-auto">
          Join thousands of highly effective people who plan their week with intention and purpose.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold rounded-full px-10 py-6 text-lg"
            asChild
          >
            <Link href={CTA_HREF}>
              Start Free Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
