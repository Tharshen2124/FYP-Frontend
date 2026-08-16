"use client"

import { motion } from "framer-motion"
import { HOW_IT_WORKS_STEPS } from "../_constants/landing"

export function HowItWorksSection() {
  return (
    <section className="relative z-10 px-6 py-24 bg-card/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground font-serif max-w-2xl mx-auto">
            Get your week planned in just 4 simple steps.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8">
          {HOW_IT_WORKS_STEPS.map((item, index) => (
            <motion.div
              key={item.step}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
                  <item.icon className="w-10 h-10 text-secondary-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold">
                  {item.step}
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground font-serif">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
