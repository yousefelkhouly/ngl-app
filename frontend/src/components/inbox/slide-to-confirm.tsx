"use client";

import { useEffect, useId, useRef, useState } from "react";
import { animate, m, useMotionValue, useTransform } from "motion/react";
import { ArrowRight, Loader2 } from "lucide-react";

const KNOB = 52;
const INSET = 4;

// an action that can't be undone, confirmed by dragging the knob to the end.
// keyboard (Enter/Space) and screen reader activation confirm directly: they can't drag,
// and they already went through the dialog. a plain mouse click does nothing
export function SlideToConfirm({
  label,
  hint,
  pending,
  onConfirm,
}: {
  label: string;
  // how to use it without dragging, read out by screen readers
  hint: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  const hintId = useId();
  const shownLabel = pending ? "Unredacting…" : label;
  const track = useRef<HTMLButtonElement>(null);
  const pointerDown = useRef(false);
  const [maxX, setMaxX] = useState(0);
  const x = useMotionValue(0);
  const labelOpacity = useTransform(x, [0, Math.max(maxX * 0.6, 1)], [1, 0]);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => setMaxX(Math.max(element.offsetWidth - KNOB - INSET * 2, 0));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // back to the start if a confirm attempt failed
  useEffect(() => {
    if (!pending) void animate(x, 0, { type: "spring", stiffness: 500, damping: 40 });
  }, [pending, x]);

  const finishDrag = () => {
    if (maxX > 0 && x.get() >= maxX * 0.85) {
      void animate(x, maxX, { duration: 0.12 });
      onConfirm();
    } else {
      void animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
    }
  };

  return (
    <button
      ref={track}
      type="button"
      aria-label={shownLabel}
      aria-describedby={hintId}
      disabled={pending}
      onPointerDown={() => {
        pointerDown.current = true;
      }}
      onClick={() => {
        // a click without a pointer press came from the keyboard or assistive tech
        if (!pointerDown.current) onConfirm();
        pointerDown.current = false;
      }}
      className="relative h-[60px] w-full touch-pan-y overflow-hidden rounded-full border-2 border-ink bg-pop text-ink shadow-hard select-none disabled:opacity-80"
    >
      <m.span
        aria-hidden="true"
        style={{ opacity: labelOpacity }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center pl-12 text-lg font-extrabold"
      >
        {shownLabel}
      </m.span>
      <span id={hintId} className="sr-only">
        {hint}
      </span>
      <m.span
        aria-hidden="true"
        drag={pending ? false : "x"}
        dragConstraints={{ left: 0, right: maxX }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={finishDrag}
        style={{ x, width: KNOB, height: KNOB, top: INSET - 2, left: INSET - 2 }}
        className="absolute flex cursor-grab items-center justify-center rounded-full bg-ink text-paper active:cursor-grabbing"
      >
        {pending ? <Loader2 className="size-6 animate-spin" /> : <ArrowRight className="size-6" strokeWidth={2.6} />}
      </m.span>
    </button>
  );
}
