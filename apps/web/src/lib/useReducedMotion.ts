import { useMediaQuery } from "@/lib/useMediaQuery";

/**
 * Returns true if the user has requested reduced motion via system preferences.
 * Subscribes to changes so the UI reacts dynamically when the preference changes.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
