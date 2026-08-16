import {
  Users,
  Briefcase,
  Heart,
  GraduationCap,
  Dumbbell,
  Home,
  Palette,
  Landmark,
} from "lucide-react"

export const ROLE_ICONS = [
  { id: "users", icon: Users, label: "Family/Friends" },
  { id: "briefcase", icon: Briefcase, label: "Professional" },
  { id: "heart", icon: Heart, label: "Partner/Spouse" },
  { id: "graduation", icon: GraduationCap, label: "Student/Learner" },
  { id: "dumbbell", icon: Dumbbell, label: "Health/Fitness" },
  { id: "home", icon: Home, label: "Home/Personal" },
  { id: "palette", icon: Palette, label: "Creative" },
  { id: "landmark", icon: Landmark, label: "Community" },
]

export const ROLE_COLORS = [
  { id: "primary", value: "#B13BFF", label: "Magenta" },
  { id: "accent", value: "#FFCC00", label: "Yellow" },
  { id: "secondary", value: "#471396", label: "Purple" },
  { id: "teal", value: "#14b8a6", label: "Teal" },
  { id: "rose", value: "#f43f5e", label: "Rose" },
  { id: "orange", value: "#f97316", label: "Orange" },
]

export const DEFAULT_ICON_ID = "users"
export const DEFAULT_COLOR_ID = "primary"

/** Past this many goals the page warns before accepting another one. */
export const MAX_RECOMMENDED_GOALS = 10
