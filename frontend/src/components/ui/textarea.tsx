import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full resize-none rounded-md border-2 border-ink bg-paper px-4 py-3 text-base font-semibold text-ink transition-shadow outline-none placeholder:font-medium placeholder:text-ink-soft focus-visible:shadow-hard-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:shadow-[3px_3px_0_var(--danger)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
