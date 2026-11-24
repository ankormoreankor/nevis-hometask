import { useEffect, useRef, useState } from "react";
import type { TickItem } from "recharts";

export type UseMonthHoverOptions = {
  rowCount: number;
  narrow: boolean;
};

const MONTH_KEY_NAV: Record<string, (current: number, max: number) => number> = {
  ArrowRight: (c, max) => Math.min(c + 1, max - 1),
  ArrowDown: (c, max) => Math.min(c + 1, max - 1),
  ArrowLeft: (c) => Math.max(c - 1, 0),
  ArrowUp: (c) => Math.max(c - 1, 0),
  Home: () => 0,
  End: (_c, max) => max - 1,
};

function nextMonthIndex(key: string, current: number, max: number): number | null {
  const handler = MONTH_KEY_NAV[key];
  return handler ? handler(current, max) : null;
}

function dispatchHover(svg: SVGSVGElement, coordinate: number, narrow: boolean) {
  const rect = svg.getBoundingClientRect();
  svg.dispatchEvent(
    new MouseEvent("mousemove", {
      bubbles: true,
      clientX: narrow ? rect.left + rect.width / 2 : rect.left + coordinate,
      clientY: narrow ? rect.top + coordinate : rect.top + rect.height / 2,
    }),
  );
}

function cancelPendingRetry(retryRef: React.MutableRefObject<number | null>) {
  if (retryRef.current !== null) {
    cancelAnimationFrame(retryRef.current);
    retryRef.current = null;
  }
}

function retryHover(
  surface: React.RefObject<SVGSVGElement | null>,
  ticks: React.RefObject<ReadonlyArray<TickItem>>,
  index: number,
  narrow: boolean,
  retryRef: React.MutableRefObject<number | null>,
) {
  retryRef.current = requestAnimationFrame(() => {
    retryRef.current = null;
    const retryPoint = ticks.current[index];
    const currentSvg = surface.current;
    if (retryPoint && currentSvg) {
      dispatchHover(currentSvg, retryPoint.coordinate, narrow);
    }
  });
}

function dispatchPointHover(
  svg: SVGSVGElement,
  point: TickItem | undefined,
  narrow: boolean,
  retryFallback: () => void,
) {
  if (point) {
    dispatchHover(svg, point.coordinate, narrow);
  } else {
    retryFallback();
  }
}

export function useMonthHover({ rowCount, narrow }: UseMonthHoverOptions) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const surface = useRef<SVGSVGElement | null>(null);
  const ticks = useRef<ReadonlyArray<TickItem>>([]);
  const retryRef = useRef<number | null>(null);

  function showMonth(index: number | null) {
    cancelPendingRetry(retryRef);
    const svg = surface.current;
    if (!svg) {
      return;
    }
    if (index === null) {
      svg.dispatchEvent(
        new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }),
      );
      return;
    }
    dispatchPointHover(svg, ticks.current[index], narrow, () =>
      retryHover(surface, ticks, index, narrow, retryRef),
    );
  }

  useEffect(() => {
    return () => {
      if (retryRef.current !== null) {
        cancelAnimationFrame(retryRef.current);
      }
    };
  }, []);

  const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setActiveIndex(0);
      showMonth(0);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setActiveIndex(null);
      showMonth(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || activeIndex === null) {
      return;
    }
    const nextIndex = nextMonthIndex(event.key, activeIndex, rowCount);
    if (nextIndex !== null) {
      event.preventDefault();
      setActiveIndex(nextIndex);
      showMonth(nextIndex);
    }
  };

  return {
    surface,
    ticks,
    handleFocus,
    handleBlur,
    handleKeyDown,
  };
}
