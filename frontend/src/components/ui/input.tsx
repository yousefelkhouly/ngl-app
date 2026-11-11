import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-md border-2 border-ink bg-paper px-4 text-base font-semibold text-ink transition-shadow outline-none placeholder:font-medium placeholder:text-ink-soft focus-visible:shadow-hard-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:shadow-[3px_3px_0_var(--danger)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
