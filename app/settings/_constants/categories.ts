import type { CalSettings, CategoryItem } from "../_types"

const MOCK_ROLES = ["Student", "Programmer", "Designer", "Team Lead"]
const SAW_DIMENSIONS = ["Physical", "Spiritual", "Mental", "Social / Emotional"]

/** Flat list of every exportable category — children carry a `parentId`. */
export const CATEGORIES: CategoryItem[] = [
  { id: "fixed-appointments", label: "Fixed Appointments" },
  { id: "sharpen-the-saw", label: "Sharpen the Saw Activities" },
  ...SAW_DIMENSIONS.map(d => ({
    id: `saw-${d.toLowerCase().replace(/\s*\/\s*/g, "-").replace(/\s+/g, "-")}`,
    label: d,
    parentId: "sharpen-the-saw",
  })),
  { id: "role-tasks", label: "Role Tasks" },
  ...MOCK_ROLES.map(r => ({
    id: `role-${r.toLowerCase().replace(/\s+/g, "-")}`,
    label: `${r} Tasks`,
    parentId: "role-tasks",
  })),
]

export const PARENT_IDS = new Set(CATEGORIES.filter(c => c.parentId).map(c => c.parentId!))

const TOP_LEVEL_ORDER = ["fixed-appointments", "sharpen-the-saw", "role-tasks"]
export const TOP_LEVEL = TOP_LEVEL_ORDER.map(id => CATEGORIES.find(c => c.id === id)!)

/** Everything leaf-level is exported by default. */
export const DEFAULT_CAL_SETTINGS: CalSettings = {
  allowSync: true,
  exportIds: new Set(CATEGORIES.filter(c => !PARENT_IDS.has(c.id)).map(c => c.id)),
}
