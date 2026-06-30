import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

export function AnimatedCheckmark() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center justify-center w-6 h-6 rounded-full bg-accent"
    >
      <CheckCircle2 className="w-4 h-4 text-accent-foreground" />
    </motion.div>
  )
}
