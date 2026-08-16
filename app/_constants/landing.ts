import { Calendar, CheckCircle2, Clock, Target, Zap } from "lucide-react"

export const HABITS = [
  { number: "1", title: "Be Proactive", description: "Take initiative and responsibility for your choices" },
  { number: "2", title: "Begin with the End in Mind", description: "Define clear goals and vision for your life" },
  { number: "3", title: "Put First Things First", description: "Prioritize what matters most" },
  { number: "4", title: "Think Win-Win", description: "Seek mutual benefit in all interactions" },
  { number: "5", title: "Seek First to Understand", description: "Listen empathetically before being heard" },
  { number: "6", title: "Synergize", description: "Combine strengths for better outcomes" },
  { number: "7", title: "Sharpen the Saw", description: "Renew yourself physically, mentally, socially" },
]

export const FEATURES = [
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

export const HOW_IT_WORKS_STEPS = [
  { step: "1", title: "Define Goals", icon: Target,       desc: "Set your weekly goals aligned with your roles and values" },
  { step: "2", title: "Add Tasks",    icon: CheckCircle2, desc: "Break down goals into actionable tasks" },
  { step: "3", title: "Drag & Drop",  icon: Clock,        desc: "Arrange tasks in your weekly schedule" },
  { step: "4", title: "Export",       icon: Calendar,     desc: "Sync with Google Calendar instantly" },
]

/** Where every landing-page call to action sends the visitor. */
export const CTA_HREF = "/login"
