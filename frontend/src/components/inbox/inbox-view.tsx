"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { m } from "motion/react";
import { cn } from "cn";
import { errorMessage } from "@/lib/api/client";
import type { Conversation, InboxMessage } from "@/lib/api/types";
import { useInbox, usePendingCount } from "@/hooks/use-inbox";
import { useConversations } from "@/hooks/use-conversations";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, NotesSkeleton } from "@/components/common/states";
import { AppPage } from "@/components/layout/app-page";
import { InboxCard } from "./inbox-card";

const FILTERS = [
  { id: "all", label: "All", matches: () => true },
  { id: "pending", label: "Can unredact", matches: (m: InboxMessage) => m.request?.status === "pending" },
  { id: "accepted", label: "Unredacted", matches: (m: InboxMessage) => m.request?.status === "accepted" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

// the inbox doesn't say which chat a revealed message opened; find it by the sender
function chatIdFor(senderId: string | undefined, conversations: Conversation[] | undefined) {
  if (!senderId || !conversations) return null;
  const match = conversations.find(
    (conversation) => conversation.sender._id === senderId || conversation.receiver._id === senderId,
  );
  return match?._id ?? null;
}

export function InboxView() {
  const { data: messages, isPending, isError, error, refetch } = useInbox();
  const conversations = useConversations();
  const [filter, setFilter] = useState<FilterId>("all");

  const visible = useMemo(() => {
    const active = FILTERS.find((option) => option.id === filter) ?? FILTERS[0];
    return messages?.filter(active.matches) ?? [];
  }, [messages, filter]);
  const pending = usePendingCount();

  return (
    <AppPage
      title={<>Things people didn&apos;t say out loud.</>}
      meta={
        messages && (
          <p className="font-mono text-sm font-bold tracking-wide text-ground-soft uppercase">
            {messages.length} {messages.length === 1 ? "note" : "notes"} · {pending} waiting for you
          </p>
        )
      }
    >
      {messages && messages.length > 0 && (
        <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
              className={cn(
                "min-h-11 rounded-full border-2 px-4 text-sm font-bold transition-colors",
                filter === option.id
                  ? "border-ink bg-paper text-ink [--focus-ring:var(--highlight)]"
                  : "border-paper/60 text-paper hover:border-paper",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {isPending ? (
        <NotesSkeleton />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : messages.length === 0 ? (
        <EmptyState
          title="No notes yet."
          action={
            <Button asChild variant="pop">
              <Link href="/link">Get your link</Link>
            </Button>
          }
        >
          Share your link and the things people never said will land here, with the sender redacted.
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState title="Nothing here.">
          {filter === "pending"
            ? "No notes are waiting for you to decide."
            : "You haven't unredacted anyone yet."}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-8 pt-2">
          {visible.map((message, index) => (
            <m.li
              key={message._id}
              layout="position"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index, 6) * 0.04 }}
            >
              <InboxCard
                message={message}
                index={index}
                chatId={chatIdFor(message.sender?._id, conversations.data)}
              />
            </m.li>
          ))}
        </ul>
      )}
    </AppPage>
  );
}
