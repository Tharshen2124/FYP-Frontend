import type { PlanDimension } from "../../_types"

/**
 * The dimensions this week has nothing chosen for.
 *
 * Habit 7 is renewal in four dimensions together — neglecting one is the thing the habit warns
 * about, not a lighter version of it — so this step asks for what `/onboarding/sharpen-the-saw`
 * asks for: at least one activity in each. Committing to a week is a weaker statement than
 * building the library was, but it is the same question, and answering it differently in the two
 * places left the weekly flow with the looser bar of the two.
 *
 * Returned as the dimensions themselves rather than a boolean so the page can name the ones still
 * missing. "Choose one for Mental and Social / Emotional" is actionable; "not every dimension is
 * covered" leaves the user counting four cards to work out which.
 */
export function dimensionsMissingSelection(
  dimensions: PlanDimension[],
  selectedActivityIds: Set<string>
): PlanDimension[] {
  return dimensions.filter(d => !d.activities.some(a => selectedActivityIds.has(a.id)))
}

/** "Physical", "Physical and Mental", "Physical, Mental and Social / Emotional". */
export function formatDimensionList(dimensions: PlanDimension[]): string {
  const labels = dimensions.map(d => d.label)
  if (labels.length <= 1) return labels.join("")

  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`
}
