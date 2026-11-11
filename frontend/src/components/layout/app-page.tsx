import type { ReactNode } from "react";

// the column and big heading every signed-in page starts with
export function AppPage({
  title,
  description,
  meta,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  // anything else under the heading, styled by the page
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-5xl leading-[0.92] font-extrabold tracking-[-0.04em] sm:text-6xl">{title}</h1>
        {description && <p className="text-lg font-semibold text-ground-soft">{description}</p>}
        {meta}
      </header>
      {children}
    </div>
  );
}
