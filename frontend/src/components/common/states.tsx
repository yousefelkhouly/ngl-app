import type { ReactNode } from "react";
import { RotateCw } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaperNote } from "@/components/brand/paper-note";

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <PaperNote tape className="mx-auto flex max-w-md -rotate-1 flex-col items-start gap-3 p-6">
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      <p className="text-base leading-relaxed text-ink-soft">{children}</p>
      {action && <div className="pt-2">{action}</div>}
    </PaperNote>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <PaperNote
      role="alert"
      className="mx-auto flex max-w-md flex-col items-start gap-3 border-danger p-6 shadow-[5px_5px_0_var(--danger)]"
    >
      <p className="font-mono text-xs font-bold tracking-wider text-danger uppercase">
        Couldn&apos;t load this
      </p>
      <p className="text-lg font-bold">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw aria-hidden="true" />
          Try again
        </Button>
      )}
    </PaperNote>
  );
}

// grey paper shapes while a list loads
export function NotesSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-6", className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-36 w-full rounded-md" />
      ))}
    </div>
  );
}
