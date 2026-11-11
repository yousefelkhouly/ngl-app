"use client";

import { Suspense, useLayoutEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "cn";
import type { InboxMessage } from "@/lib/api/types";
import { timeAgo } from "@/lib/format";
import { prefetchOnIntent, usePrefetch } from "@/hooks/use-conversations";
import { Button } from "@/components/ui/button";
import { RedactionBar } from "@/components/brand/redaction-bar";
import { Stamp, messageStamp } from "@/components/brand/stamp";
import { PaperNote, tiltFor } from "@/components/brand/paper-note";
// the dialogs (and the drag slider inside) aren't needed until someone answers a note:
// they're a separate download, started as soon as a pointer or the keyboard reaches a button
const loadDialogs = () => import("./answer-dialogs");
const RevealDialog = dynamic(() => loadDialogs().then((module) => module.RevealDialog));
const DeclineDialog = dynamic(() => loadDialogs().then((module) => module.DeclineDialog));
const preloadDialogs = prefetchOnIntent(loadDialogs);

// who it's from: a censor bar until revealed, then the name in highlighter
function From({ message }: { message: InboxMessage }) {
  const sender = message.sender;
  return (
    <p className="flex items-center gap-2 font-mono text-xs font-bold">
      FROM
      <AnimatePresence mode="wait" initial={false}>
        {sender ? (
          <m.span
            key="name"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-highlight px-1.5 font-sans text-base font-extrabold"
          >
            {sender.name}
          </m.span>
        ) : (
          <m.span
            key="bar"
            exit={{ scaleX: 0, transition: { duration: 0.35, ease: "easeIn" } }}
            style={{ originX: 1 }}
            className="inline-flex"
          >
            <RedactionBar
              label={message.request ? "Sender hidden" : "Sender hidden, sent without an account"}
              className="h-4 w-28"
            />
          </m.span>
        )}
      </AnimatePresence>
    </p>
  );
}

export function InboxCard({
  message,
  index,
  chatId,
}: {
  message: InboxMessage;
  index: number;
  chatId: string | null;
}) {
  const [dialog, setDialog] = useState<"reveal" | "decline" | null>(null);
  // a dialog left open shouldn't still be open when coming back to the inbox
  useLayoutEffect(() => () => setDialog(null), []);
  const prefetch = usePrefetch();
  const stamp = messageStamp(message);
  const status = message.request?.status;

  return (
    <PaperNote as="article" className={cn("flex flex-col gap-4 p-5 sm:p-6", tiltFor(index))}>
      <Stamp tone={stamp.tone} className="absolute -top-3.5 right-4">
        {stamp.label}
      </Stamp>
      <From message={message} />
      <p className="text-xl leading-snug font-bold tracking-tight break-words whitespace-pre-line sm:text-2xl">
        {message.content}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <time dateTime={message.createdAt} className="font-mono text-xs font-bold text-ink-soft uppercase">
          {timeAgo(message.createdAt)}
        </time>

        {status === "pending" && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" {...preloadDialogs} onClick={() => setDialog("decline")}>
              Keep redacted
            </Button>
            <Button variant="pop" size="sm" {...preloadDialogs} onClick={() => setDialog("reveal")}>
              Unredact
            </Button>
          </div>
        )}
        {status === "accepted" && (
          <Link
            href={chatId ? `/chats/${chatId}` : "/chats"}
            {...(chatId ? prefetchOnIntent(() => prefetch.conversation(chatId)) : {})}
            className="inline-flex min-h-11 items-center gap-1.5 font-bold underline decoration-2 underline-offset-4"
          >
            Open chat <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>

      {/* mounted only while open: a long inbox doesn't carry two dialogs per note. the boundary
          catches the moment the dialog code loads; without it the page's skeleton takes over,
          React hides this card, its cleanup above runs, and the dialog closes before it opens */}
      <Suspense fallback={null}>
        {message.request && dialog === "reveal" && (
          <RevealDialog message={message} open onOpenChange={(open) => setDialog(open ? "reveal" : null)} />
        )}
        {message.request && dialog === "decline" && (
          <DeclineDialog message={message} open onOpenChange={(open) => setDialog(open ? "decline" : null)} />
        )}
      </Suspense>
    </PaperNote>
  );
}
