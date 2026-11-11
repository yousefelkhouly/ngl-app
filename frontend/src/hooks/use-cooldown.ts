"use client";

import { useEffect, useState } from "react";

// seconds left before an action (like "send a new code") may run again
export function useCooldown(seconds: number) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endsAt === null) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= endsAt) {
        setEndsAt(null);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  const remaining = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000));
  return {
    remaining,
    start: () => {
      const current = Date.now();
      setNow(current);
      setEndsAt(current + seconds * 1000);
    },
  };
}
