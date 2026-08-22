/**
 * Mirrors the server's length validation on `evening_reflections.content`, shown as a counter
 * wherever a reflection is written.
 *
 * It lives here rather than in `/evening-reflections` because the End-of-Day check-in on
 * `/dashboard` writes the same row through the same endpoint, and a route may not import another
 * route's private folder.
 */
export const MAX_REFLECTION_LENGTH = 2000
