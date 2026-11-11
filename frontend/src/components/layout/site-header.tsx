"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

// the header of public pages: the landing page and someone's send page
export function SiteHeader() {
  const { user, isPending } = useSession();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8 lg:px-14">
      <Logo />
      {/* same size in every state, so nothing jumps once the session is known */}
      <nav aria-label="Account" className="flex min-h-12 items-center gap-2">
        {isPending ? null : user ? (
          <Button asChild variant="default">
            <Link href="/inbox">Open your inbox</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="default">
              <Link href="/register">Get your link</Link>
            </Button>
          </>
        )}
      </nav>
    </header>
  );
}
