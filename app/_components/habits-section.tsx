"use client"

import { motion } from "framer-motion"
import { HABITS } from "../_constants/landing"

export function HabitsSection() {
  return (
    <section id="habits" className="relative z-10 px-6 py-24">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            The <span className="text-accent">7 Habits</span> Framework
          </h2>
          <p className="text-lg text-muted-foreground font-serif max-w-2xl mx-auto">
            Based on Stephen Covey&apos;s timeless principles for personal and professional effectiveness.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {HABITS.slice(0, 4).map((habit, index) => (
            <motion.div
              key={habit.number}
              className="p-6 rounded-2xl bg-card border-2 border-border hover:border-accent/50 transition-all duration-300"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-xl mb-4">
                {habit.number}
              </div>
              <h3 className="font-bold text-foreground mb-2">{habit.title}</h3>
              <p className="text-sm text-muted-foreground font-serif">{habit.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {HABITS.slice(4).map((habit, index) => (
            <motion.div
              key={habit.number}
              className="p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/50 transition-all duration-300"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (index + 4) * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-4">
                {habit.number}
              </div>
              <h3 className="font-bold text-foreground mb-2">{habit.title}</h3>
              <p className="text-sm text-muted-foreground font-serif">{habit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
