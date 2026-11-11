"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptRequest, declineRequest, getInbox } from "@/lib/api/messages";
import { queryKeys } from "@/lib/query-keys";
import type { InboxMessage } from "@/lib/api/types";

export function useInbox() {
  return useQuery({
    queryKey: queryKeys.inbox,
    queryFn: getInbox,
    // no push from the backend: check for new notes now and then while the tab is open
    refetchInterval: 30_000,
  });
}

export function usePendingCount(): number {
  const { data } = useInbox();
  return data?.filter((message) => message.request?.status === "pending").length ?? 0;
}

function setRequestStatus(
  messages: InboxMessage[] | undefined,
  requestId: string,
  status: "accepted" | "declined",
) {
  return messages?.map((message) =>
    message.request?._id === requestId
      ? { ...message, request: { ...message.request, status } }
      : message,
  );
}

export function useAcceptRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptRequest,
    onSuccess: async (_result, requestId) => {
      queryClient.setQueryData<InboxMessage[]>(queryKeys.inbox, (messages) =>
        setRequestStatus(messages, requestId, "accepted"),
      );
      // the sender's name only comes back with a fresh inbox
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.inbox }),
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations }),
      ]);
    },
  });
}

export function useDeclineRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: declineRequest,
    onSuccess: (_result, requestId) => {
      queryClient.setQueryData<InboxMessage[]>(queryKeys.inbox, (messages) =>
        setRequestStatus(messages, requestId, "declined"),
      );
    },
  });
}
