"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const TASKS = [
  { id: 1, text: "Morning meditation", time: "6:00 AM", color: "#B13BFF", category: "Sharpen the Saw" },
  { id: 2, text: "Review weekly goals", time: "7:00 AM", color: "#FFCC00", category: "Begin with End in Mind" },
  { id: 3, text: "Deep work: Project Alpha", time: "9:00 AM", color: "#471396", category: "Put First Things First" },
  { id: 4, text: "Team sync meeting", time: "11:00 AM", color: "#B13BFF", category: "Synergize" },
  { id: 5, text: "Lunch & exercise", time: "12:30 PM", color: "#FFCC00", category: "Sharpen the Saw" },
  { id: 6, text: "Client presentation prep", time: "2:00 PM", color: "#471396", category: "Put First Things First" },
]

const TYPING_TASKS = [
  "Plan quarterly objectives...",
  "Schedule family time...",
  "Book gym session...",
  "Prepare presentation...",
  "Read leadership book...",
]

export function AnimatedSchedule() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [activeTask, setActiveTask] = useState<number | null>(null)
  const [typingText, setTypingText] = useState("")
  const [typingIndex, setTypingIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [draggedTask, setDraggedTask] = useState<number | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cursor movement animation
  useEffect(() => {
    const positions = [
      { x: 20, y: 100 },   // First task
      { x: 180, y: 200 }, // Second task
      { x: 50, y: 250 },  // Third task
      { x: 200, y: 580 }, // New task area
      { x: 100, y: 300 }, // Fifth task
      { x: 160, y: 360 }, // Sixth task
    ]

    let currentPos = 0
    const interval = setInterval(() => {
      setCursorPosition(positions[currentPos])
      setActiveTask(currentPos < TASKS.length ? currentPos : null)
      
      // Trigger drag animation occasionally
      if (currentPos === 2) {
        setDraggedTask(2)
        setTimeout(() => setDraggedTask(null), 800)
      }
      
      // Show new task input area
      if (currentPos === 3) {
        setShowNewTask(true)
        setIsTyping(true)
      } else {
        setShowNewTask(false)
        setIsTyping(false)
        // Cleared here rather than in the typing effect below: wiping the line is part of stopping
        // the animation, and doing it in an effect body is a second render just to undo the first.
        setTypingText("")
        setCharIndex(0)
      }
      
      currentPos = (currentPos + 1) % positions.length
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Typing animation
  useEffect(() => {
    if (!isTyping) return

    const currentTask = TYPING_TASKS[typingIndex]
    
    if (charIndex < currentTask.length) {
      const timeout = setTimeout(() => {
        setTypingText(currentTask.slice(0, charIndex + 1))
        setCharIndex(charIndex + 1)
      }, 80)
      return () => clearTimeout(timeout)
    } else {
      const timeout = setTimeout(() => {
        setTypingIndex((typingIndex + 1) % TYPING_TASKS.length)
        setCharIndex(0)
        setTypingText("")
      }, 1500)
      return () => clearTimeout(timeout)
    }
  }, [isTyping, charIndex, typingIndex])

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-md mx-auto"
      style={{ perspective: "1000px" }}
    >
      {/* 3D Schedule Card */}
      <motion.div
        className="relative bg-card rounded-3xl p-6 shadow-2xl border-4 border-primary/30"
        initial={{ rotateY: -15, rotateX: 5 }}
        animate={{ 
          rotateY: [-15, -10, -15],
          rotateX: [5, 8, 5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          transformStyle: "preserve-3d",
          boxShadow: "0 25px 50px -12px rgba(177, 59, 255, 0.4), 0 0 80px rgba(71, 19, 150, 0.3)",
        }}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <motion.h3 
              className="text-xl font-bold text-foreground"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Weekly Planner
            </motion.h3>
            <p className="text-sm text-muted-foreground">Monday, April 7</p>
          </div>
          <motion.div
            className="w-10 h-10 rounded-full bg-accent flex items-center justify-center"
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="text-accent-foreground font-bold text-sm">7H</span>
          </motion.div>
        </div>

        {/* Tasks */}
        <div className="space-y-3">
          {TASKS.map((task, index) => (
            <motion.div
              key={task.id}
              className={`relative p-3 rounded-xl transition-all duration-300 ${
                activeTask === index ? "ring-2 ring-accent" : ""
              }`}
              style={{ 
                backgroundColor: `${task.color}20`,
                borderLeft: `4px solid ${task.color}`,
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: draggedTask === index ? 30 : 0,
                y: draggedTask === index ? -10 : 0,
                scale: activeTask === index ? 1.02 : 1,
                boxShadow: activeTask === index 
                  ? `0 8px 20px ${task.color}40` 
                  : "none"
              }}
              transition={{ 
                delay: index * 0.1,
                duration: 0.3
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{task.text}</p>
                  <p className="text-xs text-muted-foreground">{task.category}</p>
                </div>
                <span className="text-xs text-primary text-white">{task.time}</span>
              </div>
              
              {/* Drag handle indicator */}
              <motion.div
                className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-30"
                animate={draggedTask === index ? { opacity: 1 } : {}}
              >
              </motion.div>
            </motion.div>
          ))}

          {/* New Task Input */}
          <AnimatePresence>
            {showNewTask && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative p-3 rounded-xl bg-primary/20 border-2 border-dashed border-primary"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-accent"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                  <span className="text-sm text-foreground">
                    {typingText}
                    <motion.span
                      className="inline-block w-0.5 h-4 bg-accent ml-0.5"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Animated Cursor */}
        <motion.div
          className="absolute pointer-events-none z-50"
          animate={{
            left: cursorPosition.x,
            top: cursorPosition.y,
          }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none"
            className="drop-shadow-lg"
          >
            <path
              d="M4 4L12 20L14 14L20 12L4 4Z"
              fill="#FFCC00"
              stroke="#090040"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          {/* Click ripple effect */}
          <motion.div
            className="absolute top-0 left-0 w-8 h-8 rounded-full bg-accent/30"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 2, 2], opacity: [1, 0.5, 0] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
          />
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-accent/20 blur-xl"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-primary/20 blur-xl"
          animate={{ scale: [1.3, 1, 1.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </motion.div>

      {/* Floating habit badges */}
      <motion.div
        className="absolute -top-8 right-4 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold"
        animate={{ 
          y: [-5, 5, -5],
          rotate: [-5, 5, -5]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        Be Proactive
      </motion.div>
      
      <motion.div
        className="absolute -bottom-6 left-4 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold"
        animate={{ 
          y: [5, -5, 5],
          rotate: [5, -5, 5]
        }}
        transition={{ duration: 3.5, repeat: Infinity }}
      >
        Just Do It
      </motion.div>
    </div>
  )
}
