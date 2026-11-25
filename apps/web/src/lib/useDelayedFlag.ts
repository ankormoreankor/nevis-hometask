import { useEffect, useState } from "react";

export function useDelayedFlag(value: boolean, delayMs: number): boolean {
  const [flag, setFlag] = useState(false);

  if (!value && flag) {
    setFlag(false);
  }

  useEffect(() => {
    if (!value) return;

    const timer = setTimeout(() => {
      setFlag(true);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return value ? flag : false;
}
