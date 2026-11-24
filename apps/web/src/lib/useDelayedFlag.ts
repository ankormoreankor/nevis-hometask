import { useEffect, useState } from "react";

/**
 * Delays a boolean flag transitioning to true by delayMs.
 * When value is false, returns false immediately.
 * When value becomes true, stays false until delayMs has elapsed.
 * Cleans up the timer on unmount and on a change of the value.
 */
export function useDelayedFlag(value: boolean, delayMs: number): boolean {
  const [flag, setFlag] = useState(false);

  if (!value && flag) {
    setFlag(false);
  }

  useEffect(() => {
    if (!value) {
      return;
    }

    const timer = setTimeout(() => {
      setFlag(true);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return value ? flag : false;
}
