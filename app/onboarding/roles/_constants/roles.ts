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

// Shared with /roles and /weekly-plan/goals, so the palette itself lives in lib/.
export { ROLE_COLORS, DEFAULT_COLOR_ID } from "@/lib/role-colors"

export const DEFAULT_ICON_ID = "users"

/** Past this many goals the page warns before accepting another one. */
export const MAX_RECOMMENDED_GOALS = 10
