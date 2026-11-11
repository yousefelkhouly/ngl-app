import Link from "next/link";
import { cn } from "cn";

// "un" + a redacted "said": the name reads as unsaid to screen readers
export function Logo({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="unsaid, home"
      className={cn(
        "inline-flex min-h-11 items-center text-2xl font-extrabold tracking-tight",
        className,
      )}
    >
      <span aria-hidden="true">
        un<span className="ml-px inline-block px-0.5 blur-[3px]">said</span>
      </span>
    </Link>
  );
}
