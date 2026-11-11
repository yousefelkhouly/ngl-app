"use client";

import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

// values that only exist in the browser. null during server rendering and hydration,
// so the server HTML and the first client render always match
export function useOrigin(): string | null {
  return useSyncExternalStore(noSubscription, () => window.location.origin, () => null);
}

// false while rendering on the server and while hydrating, true after
export function useHydrated(): boolean {
  return useSyncExternalStore(noSubscription, () => true, () => false);
}

export function useCanShare(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => typeof navigator.share === "function",
    () => false,
  );
}
