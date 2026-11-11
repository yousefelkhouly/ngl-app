"use client";

import Link from "next/link";
import { errorMessage } from "@/lib/api/client";
import { timeAgo } from "@/lib/format";
import { otherParticipant, prefetchOnIntent, usePrefetch, useConversations } from "@/hooks/use-conversations";
import { useCurrentUser } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common/avatar";
import { EmptyState, ErrorState, NotesSkeleton } from "@/components/common/states";
import { AppPage } from "@/components/layout/app-page";

export function ChatsList() {
  const me = useCurrentUser();
  const { data: conversations, isPending, isError, error, refetch } = useConversations();
  const prefetch = usePrefetch();

  return (
    <AppPage title="Chats" description="People you chose to unredact.">
      {isPending ? (
        <NotesSkeleton count={3} />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : conversations.length === 0 ? (
        <EmptyState
          title="No chats yet."
          action={
            <Button asChild variant="pop">
              <Link href="/inbox">Go to your inbox</Link>
            </Button>
          }
        >
          A chat opens when you unredact someone in your inbox.
        </EmptyState>
      ) : (
        <ul className="paper divide-y-2 divide-ink overflow-hidden shadow-hard">
          {conversations.map((conversation) => {
            const other = otherParticipant(conversation, me.id);
            const last = conversation.messages.at(-1);
            const preview = last?.msgId?.content ?? "Say hi.";
            const mine = last?.sender === me.id;
            return (
              <li key={conversation._id}>
                <Link
                  href={`/chats/${conversation._id}`}
                  {...prefetchOnIntent(() => prefetch.conversation(conversation._id))}
                  className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-paper-dim sm:px-5"
                >
                  <Avatar id={other._id} name={other.name} picture={other.profilePicturePath} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-lg font-extrabold">{other.name}</span>
                      <time dateTime={conversation.updatedAt} className="shrink-0 font-mono text-xs font-bold text-ink-soft">
                        {timeAgo(conversation.updatedAt)}
                      </time>
                    </span>
                    <span className="truncate text-base text-ink-soft">
                      {mine && <span className="font-bold text-ink">You: </span>}
                      {preview}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppPage>
  );
}
