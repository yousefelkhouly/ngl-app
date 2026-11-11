"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { LazyMotion, MotionConfig } from "motion/react";
import { toast } from "sonner";
import { ApiError, onSessionExpired } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import { Toaster } from "@/components/ui/sonner";

// the animation engine is a separate download, fetched after the page is up
const loadMotionFeatures = () => import("@/lib/motion-features").then((module) => module.default);

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        // a 4xx won't fix itself on a retry, a network blip or a 5xx might
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
          failureCount < 2,
      },
      mutations: { retry: false },
    },
  });
}

// when the API client gives up refreshing, forget the user: RequireAuth then sends them to /login
function SessionExpiryHandler() {
  const queryClient = useQueryClient();
  useEffect(
    () =>
      onSessionExpired(() => {
        if (queryClient.getQueryData(queryKeys.session) === null) return;
        queryClient.setQueryData(queryKeys.session, null);
        toast.error("Your session ended. Sign in again.", { id: "session-expired" });
      }),
    [queryClient],
  );
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      {/* "user": animations are skipped for people who ask their OS for reduced motion */}
      <MotionConfig reducedMotion="user">
        {/* strict: a full-size motion.* component would throw, so none slips in by accident */}
        <LazyMotion features={loadMotionFeatures} strict>
          <SessionExpiryHandler />
          {children}
          <Toaster position="top-center" />
        </LazyMotion>
      </MotionConfig>
    </QueryClientProvider>
  );
}
