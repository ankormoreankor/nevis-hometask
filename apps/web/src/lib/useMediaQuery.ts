import { useEffect, useState } from "react";

/**
 * Returns true if the viewport matches the given media query string.
 * Modelled on useReducedMotion: lazy initializer that reads matchMedia with
 * a typeof window guard, and an effect that subscribes to the change event
 * and syncs once on mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    const onChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    mediaQuery.addEventListener("change", onChange);
    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, [query]);

  return matches;
}
