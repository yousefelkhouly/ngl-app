"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { safeNextPath } from "@/lib/format";

// someone already signed in has no business on the login or sign-up pages
export function RedirectIfSignedIn() {
  const { user } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user) router.replace(safeNextPath(searchParams.get("next")));
  }, [user, router, searchParams]);

  return null;
}
