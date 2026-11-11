"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";

// the wide strip at the top of a profile. several images become a slideshow:
// native scroll-snap does the swiping, the buttons and dots only scroll it
export function CoverBanner({ images, name, className }: { images: string[]; name: string; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const count = images.length;

  const show = (index: number) => {
    const element = track.current;
    if (!element) return;
    const target = (index + count) % count;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ left: target * element.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const frame = cn("relative h-36 w-full border-b-2 border-ink sm:h-52 lg:h-60", className);

  if (count === 0) {
    // nothing uploaded: a plain patterned strip, so the layout stays the same
    return (
      <div
        aria-hidden="true"
        className={cn(frame, "bg-[repeating-linear-gradient(135deg,var(--ground-soft)_0_14px,var(--paper)_14px_28px)]")}
      />
    );
  }

  return (
    <div role="region" aria-roledescription="carousel" aria-label={`Cover photos of ${name}`} className={frame}>
      <div
        ref={track}
        onScroll={(event) => {
          const element = event.currentTarget;
          setCurrent(Math.round(element.scrollLeft / Math.max(element.clientWidth, 1)));
        }}
        className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, index) => (
          <div
            key={src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
            className="relative size-full shrink-0 snap-start"
          >
            {/* served by the backend through the /uploads proxy, like the avatars */}
            <Image
              src={src}
              alt={`${name}'s cover image ${index + 1}`}
              fill
              sizes="(min-width: 1024px) 64rem, 100vw"
              priority={index === 0}
              unoptimized
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <SlideButton side="left" label="Previous cover image" onClick={() => show(current - 1)} />
          <SlideButton side="right" label="Next cover image" onClick={() => show(current + 1)} />
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full border-2 border-ink bg-paper px-2.5 py-1.5">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                aria-label={`Show cover image ${index + 1}`}
                aria-current={index === current ? "true" : undefined}
                onClick={() => show(index)}
                className={cn(
                  "size-2.5 rounded-full border-2 border-ink transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink",
                  index === current ? "bg-ink" : "bg-paper",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SlideButton({ side, label, onClick }: { side: "left" | "right"; label: string; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink shadow-hard-sm focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
