"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CurrentUserContext, useSession } from "@/hooks/use-session";
import { ErrorState, NotesSkeleton } from "@/components/common/states";

// the session is only known in the browser (see app/api/auth/session), so protected
// pages are gated here: a skeleton while checking, a redirect to /login without a user
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isPending, isError, refetch } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isPending && !isError && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isPending, isError, user, router, pathname]);

  if (isError) {
    return (
      <div className="px-4 py-16">
        <ErrorState
          message="We couldn't check whether you're signed in."
          onRetry={refetch}
        />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <NotesSkeleton />
      </div>
    );
  }
  return <CurrentUserContext value={user}>{children}</CurrentUserContext>;
}
