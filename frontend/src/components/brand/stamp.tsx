import { cn } from "cn";
import type { InboxMessage } from "@/lib/api/types";

const tones = {
  pop: "bg-pop border-solid",
  highlight: "bg-highlight border-solid",
  paper: "bg-paper border-solid",
  dashed: "bg-paper border-dashed",
} as const;

// a rubber-stamp status label, tilted like it was pressed on by hand
export function Stamp({
  tone,
  children,
  className,
}: {
  tone: keyof typeof tones;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rotate-[5deg] border-2 border-ink px-2 py-1 font-mono text-[11px] leading-none font-bold tracking-wider text-ink uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// the stamp a message in the inbox gets, from its request status
export function messageStamp(message: InboxMessage): { tone: keyof typeof tones; label: string } {
  switch (message.request?.status) {
    case "pending":
      return { tone: "pop", label: "Can unredact" };
    case "accepted":
      return { tone: "highlight", label: "Unredacted" };
    case "declined":
      return { tone: "paper", label: "Kept redacted" };
    default:
      return { tone: "dashed", label: "Sealed for good" };
  }
}
