import { cn } from "cn";

// the blurred smear that stands in for a hidden sender, in the colour of the text around it
export function RedactionBar({
  label = "Sender hidden",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-block h-[1em] w-[7em] rounded-sm bg-current align-[-0.12em] opacity-70 blur-[4px]", className)}
    />
  );
}
