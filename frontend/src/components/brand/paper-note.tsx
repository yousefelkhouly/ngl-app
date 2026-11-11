import { cn } from "cn";

// a small set of tilts, picked by position, so a list looks hand-placed but never shifts
const TILTS = ["-rotate-[1.4deg]", "rotate-[1deg]", "-rotate-[0.6deg]", "rotate-[0.8deg]"];

export function tiltFor(index: number): string {
  return TILTS[index % TILTS.length];
}

// a sheet of paper with a hard shadow and, optionally, a strip of tape on top
export function PaperNote({
  as: Tag = "div",
  tape = false,
  className,
  children,
  ...props
}: {
  as?: "div" | "article" | "li" | "section";
  tape?: boolean;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cn("paper relative shadow-hard", className)} {...props}>
      {tape && (
        <span
          aria-hidden="true"
          className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-2 bg-highlight/85"
        />
      )}
      {children}
    </Tag>
  );
}
