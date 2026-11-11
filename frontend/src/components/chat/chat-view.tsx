"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowUp } from "lucide-react";
import { cn } from "cn";
import { ApiError, errorMessage } from "@/lib/api/client";
import { clockTime } from "@/lib/format";
import { CONTENT_MAX, chatMessageSchema, isObjectId, type ChatMessageValues } from "@/lib/validation";
import type { ConversationMessage } from "@/lib/api/types";
import { otherParticipant, useConversation, useSendChatMessage } from "@/hooks/use-conversations";
import { useCurrentUser } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common/avatar";
import { EmptyState, ErrorState, NotesSkeleton } from "@/components/common/states";
import { FormError } from "@/components/common/form-field";
import { PaperNote } from "@/components/brand/paper-note";
import { useFieldIds } from "@/hooks/use-field-ids";

function Bubble({ message, mine }: { message: ConversationMessage; mine: boolean }) {
  if (!message.msgId) return null;
  return (
    <li className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
      <p
        className={cn(
          "max-w-[85%] border-2 border-ink px-4 py-2.5 text-base leading-snug font-semibold break-words whitespace-pre-line shadow-hard-sm sm:max-w-[70%]",
          mine
            ? "rounded-[18px_18px_4px_18px] bg-ground text-paper"
            : "rounded-[18px_18px_18px_4px] bg-paper text-ink",
          message.pending && "opacity-60",
        )}
      >
        {message.msgId.content}
      </p>
      <span className="px-1 font-mono text-[11px] font-bold text-ink-soft">
        {message.pending ? "Sending…" : clockTime(message.msgId.createdAt)}
      </span>
    </li>
  );
}

function Composer({ conversationId, myId }: { conversationId: string; myId: string }) {
  const send = useSendChatMessage(conversationId, myId);
  const ids = useFieldIds("reply");
  const form = useForm<ChatMessageValues>({
    resolver: zodResolver(chatMessageSchema),
    defaultValues: { content: "" },
  });

  const submit = form.handleSubmit(({ content }) => {
    form.reset();
    send.mutate(content, { onError: () => form.setValue("content", content) });
  });

  return (
    <form
      onSubmit={submit}
      className="sticky bottom-24 flex flex-col gap-2 rounded-b-[4px] border-t-2 border-ink bg-paper p-3 sm:p-4 lg:bottom-0"
    >
      <FormError message={send.error ? errorMessage(send.error) : null} />
      <div className="flex items-end gap-2">
        <label htmlFor={ids.reply} className="sr-only">
          Write a message
        </label>
        <textarea
          id={ids.reply}
          rows={1}
          maxLength={CONTENT_MAX}
          placeholder="Say it…"
          {...form.register("content")}
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter adds a line
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void submit();
            }
          }}
          className="max-h-40 min-h-12 flex-1 resize-none rounded-3xl border-2 border-ink bg-paper px-4 py-2.5 text-base font-semibold text-ink [field-sizing:content] placeholder:text-ink-soft focus-visible:shadow-hard-sm focus-visible:outline-none"
        />
        <Button type="submit" variant="pop" size="icon" aria-label="Send">
          <ArrowUp strokeWidth={2.6} />
        </Button>
      </div>
    </form>
  );
}

export function ChatView({ id }: { id: string }) {
  const me = useCurrentUser();
  const valid = isObjectId(id);
  const { data: conversation, isPending, isError, error, refetch } = useConversation(id);
  const endRef = useRef<HTMLDivElement>(null);
  const count = conversation?.messages.length ?? 0;

  // follow the conversation down as messages arrive
  useEffect(() => {
    if (count > 0) endRef.current?.scrollIntoView({ block: "end" });
  }, [count]);

  const back = (
    <Link href="/chats" className="inline-flex min-h-11 items-center gap-2 font-bold">
      <ArrowLeft aria-hidden="true" className="size-5" /> All chats
    </Link>
  );

  if (!valid || (isError && error instanceof ApiError && (error.status === 404 || error.status === 400))) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {back}
        <EmptyState title="This chat doesn't exist.">It may have been removed, or it isn&apos;t yours.</EmptyState>
      </div>
    );
  }
  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <NotesSkeleton count={2} />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {back}
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      </div>
    );
  }

  const other = otherParticipant(conversation, me.id);
  const [first, ...rest] = conversation.messages;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {back}
      <section aria-label={`Chat with ${other.name}`} className="paper flex flex-col shadow-hard">
        <header className="flex items-center gap-3 rounded-t-[4px] border-b-2 border-ink bg-ground px-4 py-4 text-paper sm:px-5">
          <Avatar id={other._id} name={other.name} picture={other.profilePicturePath} />
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-2xl leading-tight font-extrabold tracking-tight">{other.name}</h1>
            <p className="font-mono text-[11px] font-bold tracking-wider text-ground-soft uppercase">Unredacted</p>
          </div>
        </header>

        <div className="flex min-h-[50vh] flex-col gap-5 px-3 py-6 sm:px-5">
          {first?.msgId && (
            <PaperNote tape className="mx-auto w-[92%] -rotate-1 px-4 pt-5 pb-4">
              <p className="font-mono text-[11px] font-bold tracking-wider text-ink-soft uppercase">Where it started</p>
              <p className="mt-1 text-lg leading-snug font-bold break-words whitespace-pre-line">{first.msgId.content}</p>
            </PaperNote>
          )}
          {rest.length === 0 && (
            <p className="text-center text-base font-semibold text-ink-soft">
              {first?.sender === me.id ? "Waiting for their reply." : `Say something to ${other.name}.`}
            </p>
          )}
          <ol role="log" aria-live="polite" aria-label="Messages" className="flex flex-col gap-3">
            {rest.map((message) => (
              <Bubble key={message._id} message={message} mine={message.sender === me.id} />
            ))}
          </ol>
          <div ref={endRef} />
        </div>

        <Composer conversationId={conversation._id} myId={me.id} />
      </section>
    </div>
  );
}
