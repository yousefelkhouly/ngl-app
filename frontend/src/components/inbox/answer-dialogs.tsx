"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api/client";
import type { InboxMessage } from "@/lib/api/types";
import { useAcceptRequest, useDeclineRequest, useNoteAction, type NoteAction } from "@/hooks/use-inbox";
import type { ReportReason } from "@/lib/api/messages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormError } from "@/components/common/form-field";
import { SlideToConfirm } from "./slide-to-confirm";

interface DialogProps {
  message: InboxMessage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Quote({ content }: { content: string }) {
  return (
    <blockquote className="-rotate-1 rounded-md border-2 border-dashed border-ink px-4 py-3 text-lg leading-snug font-bold break-words">
      {content}
    </blockquote>
  );
}

export function RevealDialog({ message, open, onOpenChange }: DialogProps) {
  const router = useRouter();
  const accept = useAcceptRequest();

  const confirm = () => {
    if (!message.request || accept.isPending) return;
    accept.mutate(message.request._id, {
      onSuccess: ({ conversation }) => {
        onOpenChange(false);
        toast.success("Unredacted. Your chat is open.", {
          action: { label: "Open chat", onClick: () => router.push(`/chats/${conversation._id}`) },
        });
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) accept.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unredact this sender?</DialogTitle>
          <DialogDescription>
            You&apos;ll see who wrote this, and a chat with them opens. You can&apos;t hide them again
            afterwards.
          </DialogDescription>
        </DialogHeader>
        <Quote content={message.content} />
        <FormError message={accept.error ? errorMessage(accept.error) : null} />
        <SlideToConfirm
          label="Slide to unredact"
          hint="Drag the handle to the end, or press Enter, to see who sent this."
          pending={accept.isPending}
          onConfirm={confirm}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeclineDialog({ message, open, onOpenChange }: DialogProps) {
  const decline = useDeclineRequest();

  const confirm = () => {
    if (!message.request) return;
    decline.mutate(message.request._id, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success("Kept redacted. You'll never know who sent it.");
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) decline.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keep them redacted forever?</DialogTitle>
          <DialogDescription>
            The note stays in your inbox, but you&apos;ll never be able to see who sent it.
          </DialogDescription>
        </DialogHeader>
        <Quote content={message.content} />
        <FormError message={decline.error ? errorMessage(decline.error) : null} />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="default" onClick={confirm} disabled={decline.isPending}>
            {decline.isPending ? "Saving…" : "Keep redacted"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate speech" },
  { value: "threat", label: "Threat of violence or self-harm" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Something else" },
];

const DONE_MESSAGE: Record<NoteAction["kind"], string> = {
  delete: "Note deleted.",
  block: "Sender blocked. Their notes are gone and they can't send you more.",
  report: "Reported, and removed from your inbox. Thanks for telling us.",
};

// delete the note, block whoever sent it, or report it
export function NoteActionsDialog({ message, open, onOpenChange }: DialogProps) {
  const action = useNoteAction(message._id);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  // only notes sent with an account can be traced to someone
  const canBlock = Boolean(message.request);

  const run = (next: NoteAction) => {
    if (action.isPending) return;
    action.mutate(next, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(DONE_MESSAGE[next.kind]);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) action.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reporting ? "Report this note" : "Delete, block or report"}</DialogTitle>
          <DialogDescription>
            {reporting
              ? "What's wrong with it? The note leaves your inbox and is kept for review."
              : canBlock
                ? "Blocking stops this sender from sending you notes or messages, without showing you who they are."
                : "This note was sent without an account, so there's no one to block. You can delete or report it."}
          </DialogDescription>
        </DialogHeader>
        <Quote content={message.content} />

        {reporting ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Reason</legend>
            {REPORT_REASONS.map((option) => (
              <label
                key={option.value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border-2 border-ink px-3 font-bold has-[:checked]:bg-highlight"
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={option.value}
                  checked={reason === option.value}
                  onChange={() => setReason(option.value)}
                  className="size-4 accent-ink"
                />
                {option.label}
              </label>
            ))}
          </fieldset>
        ) : null}

        <FormError message={action.error ? errorMessage(action.error) : null} />

        {reporting ? (
          <DialogFooter>
            <Button variant="outline" onClick={() => setReporting(false)} disabled={action.isPending}>
              Back
            </Button>
            <Button
              variant="default"
              onClick={() => reason && run({ kind: "report", reason })}
              disabled={!reason || action.isPending}
            >
              {action.isPending ? "Sending…" : "Send report"}
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter className="flex-wrap">
            <Button variant="outline" onClick={() => setReporting(true)} disabled={action.isPending}>
              Report
            </Button>
            {canBlock && (
              <Button variant="destructive" onClick={() => run({ kind: "block" })} disabled={action.isPending}>
                Block sender
              </Button>
            )}
            <Button variant="default" onClick={() => run({ kind: "delete" })} disabled={action.isPending}>
              {action.isPending ? "Working…" : "Delete note"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
