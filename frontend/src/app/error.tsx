"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// a crash while rendering a page: offer a retry instead of a blank screen
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex flex-1 items-center px-4 py-16 sm:px-8 lg:px-14">
      <div className="paper flex max-w-lg flex-col gap-4 p-6 shadow-hard-lg sm:p-8">
        <p className="font-mono text-xs font-bold tracking-wider uppercase">Something broke</p>
        <h1 className="text-4xl leading-tight font-extrabold tracking-tight">This page hit an error.</h1>
        <p className="text-base text-ink-soft">Try again. If it keeps happening, reload the page.</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button variant="pop" onClick={reset}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
