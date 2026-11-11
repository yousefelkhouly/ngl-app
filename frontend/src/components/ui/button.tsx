import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// chunky, inked buttons with a hard offset shadow that "presses" on click
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-ink font-bold whitespace-nowrap transition-[transform,box-shadow,background-color] duration-150 select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-ink text-paper shadow-[3px_3px_0_var(--paper)] hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        pop: "bg-pop text-ink shadow-hard hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        outline:
          "bg-paper text-ink shadow-hard-sm hover:bg-paper-dim active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        ghost:
          "border-transparent bg-transparent text-current hover:bg-ink/10",
        destructive:
          "bg-paper text-danger border-danger shadow-[3px_3px_0_var(--danger)] hover:bg-danger/5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        link: "rounded-none border-0 p-0 h-auto text-current underline underline-offset-4 decoration-2 hover:decoration-pop",
      },
      size: {
        default: "h-12 px-6 text-base",
        sm: "h-11 px-4 text-sm",
        lg: "h-14 px-8 text-lg",
        icon: "size-12",
        "icon-sm": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
