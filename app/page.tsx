"use client"

import { motion } from "framer-motion"
import { Calendar, Target, Zap, ArrowRight, CheckCircle2, Sparkles, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedSchedule } from "../components/animated-schedule"

const HABITS = [
  { number: "1", title: "Be Proactive", description: "Take initiative and responsibility for your choices" },
  { number: "2", title: "Begin with the End in Mind", description: "Define clear goals and vision for your life" },
  { number: "3", title: "Put First Things First", description: "Prioritize what matters most" },
  { number: "4", title: "Think Win-Win", description: "Seek mutual benefit in all interactions" },
  { number: "5", title: "Seek First to Understand", description: "Listen empathetically before being heard" },
  { number: "6", title: "Synergize", description: "Combine strengths for better outcomes" },
  { number: "7", title: "Sharpen the Saw", description: "Renew yourself physically, mentally, socially" },
]

const FEATURES = [
  {
    icon: Target,
    title: "Define Your Goals",
    description: "Set meaningful goals aligned with your personal mission and values. Organize them by life roles and priorities.",
    color: "#B13BFF",
  },
  {
    icon: Zap,
    title: "Smart Task Planning",
    description: "Break down goals into actionable tasks. Our AI suggests optimal time slots based on your energy patterns.",
    color: "#FFCC00",
  },
  {
    icon: Calendar,
    title: "Google Calendar Sync",
    description: "Seamlessly export your weekly plan to Google Calendar. Stay organized across all your devices.",
    color: "#471396",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      {/* <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">HabitFlow</span>
          </motion.div>
          
          <motion.div 
            className="hidden md:flex items-center gap-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#habits" className="text-muted-foreground hover:text-foreground transition-colors">7 Habits</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold rounded-full px-6">
              Get Started
            </Button>
          </motion.div>
        </div>
      </nav> */}

      {/* Hero Section */}
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
              >
                Start Planning Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-secondary text-foreground hover:bg-secondary/20 rounded-full px-8 py-6 text-lg"
              >
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <motion.div
              className="mt-12 flex items-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div>
              </div>
            </motion.div>
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

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-24 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to{" "}
              <span className="text-primary">Succeed</span>
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

      {/* 7 Habits Section */}
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

      {/* How It Works Section */}
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
            {[
              { step: "1", title: "Define Goals", icon: Target, desc: "Set your weekly goals aligned with your roles and values" },
              { step: "2", title: "Add Tasks", icon: CheckCircle2, desc: "Break down goals into actionable tasks" },
              { step: "3", title: "Drag & Drop", icon: Clock, desc: "Arrange tasks in your weekly schedule" },
              { step: "4", title: "Export", icon: Calendar, desc: "Sync with Google Calendar instantly" },
            ].map((item, index) => (
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

      {/* CTA Section */}
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
            >
              Start Free Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">HabitFlow</span>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          
          <p className="text-sm text-muted-foreground">
            2026 HabitFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
