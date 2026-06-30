import { motion } from "framer-motion"
import { floatingTasks } from "../_constants"

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl"
        animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/30 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], x: [0, -50, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/10 blur-3xl"
        animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {floatingTasks.map(task => (
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
          transition={{ duration: 8, delay: task.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          {task.text}
        </motion.div>
      ))}

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#B13BFF 1px, transparent 1px), linear-gradient(90deg, #B13BFF 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  )
}
