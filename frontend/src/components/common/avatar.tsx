import Image from "next/image";
import { cn } from "cn";
import { initials } from "@/lib/format";

// paired so the initials always pass contrast on their background
const SWATCHES = [
  "bg-highlight text-ink",
  "bg-pop text-ink",
  "bg-ground-soft text-ink",
  "bg-paper text-ink",
];

function swatchFor(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return SWATCHES[hash % SWATCHES.length];
}

const sizes = {
  sm: "size-10 text-sm",
  md: "size-12 text-base",
  lg: "size-20 text-2xl",
  xl: "size-24 text-3xl sm:size-32 sm:text-4xl",
} as const;
// the largest size each one is drawn at
const pixels = { sm: 40, md: 48, lg: 80, xl: 128 } as const;

export function Avatar({
  id,
  name,
  picture,
  size = "md",
  className,
}: {
  id: string;
  name: string;
  picture?: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const classes = cn(
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ink font-extrabold",
    sizes[size],
    className,
  );

  if (picture) {
    return (
      <span className={classes}>
        {/* served by the backend through the /uploads proxy; small files, not worth resizing */}
        <Image
          src={picture}
          alt=""
          width={pixels[size]}
          height={pixels[size]}
          unoptimized
          className="size-full object-cover"
        />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={cn(classes, swatchFor(id))}>
      {initials(name)}
    </span>
  );
}
