"use client";

import { useMemo } from "react";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getConversation,
  getConversations,
  sendConversationMessage,
} from "@/lib/api/conversations";
import { queryKeys } from "@/lib/query-keys";
import type { Conversation, PublicUser } from "@/lib/api/types";

// each query's key and fetcher, shared by its hook and its prefetch
const conversationsQuery = queryOptions({
  queryKey: queryKeys.conversations,
  queryFn: getConversations,
});

const conversationQuery = (id: string) =>
  queryOptions({
    queryKey: queryKeys.conversation(id),
    queryFn: () => getConversation(id),
  });

export function useConversations() {
  return useQuery({ ...conversationsQuery, refetchInterval: 20_000 });
}

export function useConversation(id: string) {
  return useQuery({
    ...conversationQuery(id),
    // the backend has no live updates: poll while the chat is on screen
    // (TanStack Query pauses this when the tab is in the background)
    refetchInterval: 4_000,
  });
}

// what's fresh enough to show without asking again: a prefetch just before a click counts
const PREFETCH_STALE_MS = 10_000;

// load data before it's needed, so a click shows it straight away instead of a skeleton.
// calling these again while the data is fresh does nothing
export function usePrefetch() {
  const queryClient = useQueryClient();
  // one stable object, so it can be an effect dependency
  return useMemo(() => ({
    conversations: () =>
      void queryClient.prefetchQuery({ ...conversationsQuery, staleTime: PREFETCH_STALE_MS }),
    conversation: (id: string) =>
      void queryClient.prefetchQuery({ ...conversationQuery(id), staleTime: PREFETCH_STALE_MS }),
  }), [queryClient]);
}

// props that start loading something on hover, keyboard focus or touch,
// which comes a few hundred milliseconds before the click
export function prefetchOnIntent(prefetch: () => void) {
  return { onPointerEnter: prefetch, onFocus: prefetch, onTouchStart: prefetch };
}

export function otherParticipant(conversation: Conversation, myId: string): PublicUser {
  return conversation.sender._id === myId ? conversation.receiver : conversation.sender;
}

export function useSendChatMessage(conversationId: string, myId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.conversation(conversationId);

  return useMutation({
    mutationFn: (content: string) => sendConversationMessage(conversationId, content),
    // show the message right away, marked as sending, and roll back if it fails
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Conversation>(key);
      const tempId = `pending-${crypto.randomUUID()}`;
      queryClient.setQueryData<Conversation>(key, (conversation) =>
        conversation
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                {
                  _id: tempId,
                  sender: myId,
                  pending: true,
                  msgId: { _id: tempId, content, createdAt: new Date().toISOString() },
                },
              ],
            }
          : conversation,
      );
      return { previous };
    },
    onError: (_error, _content, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: key }),
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations, exact: true }),
      ]),
  });
}
