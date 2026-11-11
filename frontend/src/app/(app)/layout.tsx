import { Suspense } from "react";
import type { Metadata } from "next";
import { AppNav } from "@/components/layout/app-nav";
import { RequireAuth } from "@/components/layout/require-auth";
import { NotesSkeleton } from "@/components/common/states";

// every page in this group sets `instant = false`: it renders only after the browser confirms
// the session (RequireAuth below), so Next can't render it ahead of time to check instant
// navigation. moving between signed-in pages is still instant: this layout stays mounted
// and only the page changes

// private pages: keep them out of search engines
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-2xl px-4 py-12">
          <NotesSkeleton />
        </div>
      }
    >
      <RequireAuth>
        <div className="flex min-h-dvh flex-1">
          <AppNav />
          <main
            className="min-w-0 flex-1 px-4 pt-8 pb-32 sm:px-8 lg:px-12 lg:pt-12 lg:pb-12"
          >
            {children}
          </main>
        </div>
      </RequireAuth>
    </Suspense>
  );
}
