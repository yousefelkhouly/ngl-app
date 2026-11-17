"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptRequest,
  blockNoteSender,
  declineRequest,
  deleteNote,
  getInbox,
  reportNote,
  type ReportReason,
} from "@/lib/api/messages";
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

export type NoteAction = { kind: "delete" } | { kind: "block" } | { kind: "report"; reason: ReportReason };

function runNoteAction(messageId: string, action: NoteAction) {
  if (action.kind === "delete") return deleteNote(messageId);
  if (action.kind === "block") return blockNoteSender(messageId);
  return reportNote(messageId, action.reason);
}

// delete, block the sender or report: each takes the note out of the inbox.
// blocking also clears that sender's other notes, so the inbox is fetched again
export function useNoteAction(messageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: NoteAction) => runNoteAction(messageId, action),
    onSuccess: async (_result, action) => {
      queryClient.setQueryData<InboxMessage[]>(queryKeys.inbox, (messages) =>
        messages?.filter((message) => message._id !== messageId),
      );
      if (action.kind === "block") {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.inbox }),
          queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
        ]);
      }
    },
  });
}
