import type { ReactNode } from "react";
import { PaperNote } from "@/components/brand/paper-note";

// the paper sheet every auth form sits on
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PaperNote className="flex flex-col gap-6 p-6 sm:p-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl leading-none font-extrabold tracking-tight">{title}</h1>
          {description && <p className="text-base leading-relaxed text-ink-soft">{description}</p>}
        </header>
        {children}
      </PaperNote>
      {footer && <div className="text-center text-base font-semibold">{footer}</div>}
    </div>
  );
}
