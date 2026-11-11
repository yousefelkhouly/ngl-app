"use client";

import { createContext, use } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchSession, logout } from "@/lib/api/auth";
import { queryKeys } from "@/lib/query-keys";
import type { SessionUser } from "@/lib/api/types";
import { useHydrated } from "./use-browser";

// who is signed in. reported as pending until the page has hydrated: the server never knows
// the session, and parts of a page can hydrate after the session request already finished,
// so using it earlier would render something different from the server HTML
export function useSession(): {
  user: SessionUser | null | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const hydrated = useHydrated();
  const query = useQuery({
    queryKey: queryKeys.session,
    queryFn: fetchSession,
    staleTime: 60_000,
  });
  return {
    user: hydrated ? query.data : undefined,
    isPending: !hydrated || query.isPending,
    isError: hydrated && query.isError,
    refetch: () => void query.refetch(),
  };
}

// filled by RequireAuth, so pages inside it always have a user
export const CurrentUserContext = createContext<SessionUser | null>(null);

export function useCurrentUser(): SessionUser {
  const user = use(CurrentUserContext);
  if (!user) throw new Error("useCurrentUser must be used inside RequireAuth");
  return user;
}

// after a login endpoint set the cookies: load the user, then go on
export function useSignedIn() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return async (next: string) => {
    await queryClient.fetchQuery({ queryKey: queryKeys.session, queryFn: fetchSession, staleTime: 0 });
    router.replace(next);
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: logout,
    // signed out locally even if the request failed: the cookies expire on their own
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(queryKeys.session, null);
      router.replace("/login");
    },
  });
}
