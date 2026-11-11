import type { ReactNode } from "react";
import { cn } from "cn";
import { Label } from "@/components/ui/label";

// a label, its control and its error, wired together for screen readers.
// the control itself spreads fieldControlProps(id, error)
export function fieldErrorId(id: string) {
  return `${id}-error`;
}

// the id and aria attributes that tie a control to its FormField's label and error
export function fieldControlProps(id: string, error: unknown) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? fieldErrorId(id) : undefined,
  } as const;
}

export function FormField({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={fieldErrorId(id)} className="text-sm font-bold text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-sm text-ink-soft">{hint}</p>
      )}
    </div>
  );
}

// an error from the server about the whole form, announced when it appears
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-md border-2 border-danger bg-paper px-4 py-3 text-sm font-bold text-danger"
    >
      {message}
    </p>
  );
}
