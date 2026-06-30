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

export const MAX_RECOMMENDED_GOALS = 10

export function getIconComponent(iconId: string) {
  return ROLE_ICONS.find(i => i.id === iconId)?.icon ?? Users
}

export function getColor(colorId: string) {
  return ROLE_COLORS.find(c => c.id === colorId)?.value ?? "#B13BFF"
}
