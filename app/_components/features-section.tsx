"use client"

import { motion } from "framer-motion"
import { FEATURES } from "../_constants/landing"

export function FeaturesSection() {
  return (
    <section id="features" className="relative z-10 px-6 py-24 bg-card/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to <span className="text-primary">Succeed</span>
          </h2>
          <p className="text-lg text-muted-foreground font-serif max-w-2xl mx-auto">
            Powerful features designed to help you implement the 7 Habits into your daily life.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="relative p-8 rounded-3xl bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: `${feature.color}20` }}
              >
                <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground font-serif leading-relaxed">{feature.description}</p>

              {/* Decorative corner */}
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: feature.color }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
