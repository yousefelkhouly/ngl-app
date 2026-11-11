"use client";

import { useId } from "react";

// unique ids for a form's fields. never hard-code ids like "email": Next keeps recently
// visited pages mounted (hidden), so two pages' "email" fields would share one id and
// a label could point at the hidden page's input
export function useFieldIds<const T extends string>(...names: T[]): Record<T, string> {
  const base = useId();
  return Object.fromEntries(names.map((name) => [name, `${base}${name}`])) as Record<T, string>;
}
