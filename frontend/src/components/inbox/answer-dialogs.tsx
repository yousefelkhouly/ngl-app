"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api/client";
import type { InboxMessage } from "@/lib/api/types";
import { useAcceptRequest, useDeclineRequest } from "@/hooks/use-inbox";
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
