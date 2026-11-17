"use client";

import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { useCanShare, useOrigin } from "@/hooks/use-browser";
import { Button } from "@/components/ui/button";
import { PaperNote } from "@/components/brand/paper-note";
import { Skeleton } from "@/components/ui/skeleton";
import { AppPage } from "@/components/layout/app-page";

export function LinkView() {
  // the username comes with the profile
  const profile = useProfile();
  const origin = useOrigin();
  const canShare = useCanShare();
  const username = profile.data?.username;
  const url = origin && username ? `${origin}/u/${username}` : null;

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied. Paste it anywhere.");
    } catch {
      toast.error("Couldn't copy. Select the link and copy it yourself.");
    }
  };

  const share = async () => {
    if (!url) return;
    try {
      await navigator.share({ title: "Send me an anonymous note", url });
    } catch (error) {
      // closing the share sheet isn't an error worth showing
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Couldn't open sharing. Copy the link instead.");
    }
  };

  return (
    <AppPage
      title="Your link"
      description="Put it in your bio, your story, your group chat. Whoever opens it can leave you a note."
    >
      <PaperNote tape className="flex -rotate-1 flex-col gap-5 p-6 sm:p-8">
        <p className="font-mono text-xs font-bold tracking-wider uppercase">Send me an anonymous note</p>
        {url ? (
          <p className="text-xl font-extrabold break-all select-all sm:text-2xl" data-testid="share-url">
            {url}
          </p>
        ) : (
          <Skeleton className="h-8 w-full bg-paper-dim" />
        )}
        {username && (
          <p className="-mt-2 text-sm font-semibold text-ink-soft">
            Your username is <strong className="text-ink">@{username}</strong>.{" "}
            <Link href="/profile#account" className="font-bold text-ink underline underline-offset-4">
              Change it
            </Link>
          </p>
        )}
        {profile.isError && <p role="alert" className="text-sm font-bold text-danger">Couldn&apos;t load your link. Reload the page.</p>}
        <div className="flex flex-wrap gap-3">
          <Button variant="pop" onClick={() => void copy()} disabled={!url}>
            <Copy aria-hidden="true" /> Copy link
          </Button>
          {canShare && (
            <Button variant="outline" onClick={() => void share()} disabled={!url}>
              <Share2 aria-hidden="true" /> Share
            </Button>
          )}
        </div>
      </PaperNote>

      <ol className="grid gap-4 sm:grid-cols-3">
        {[
          ["Share it", "Anyone with the link can write to you, with or without an account."],
          ["Read the notes", "They land in your inbox with the sender redacted."],
          ["Your call", "Unredact a sender to see who it was and start a chat, or keep them hidden."],
        ].map(([title, text], index) => (
          <li key={title} className="flex flex-col gap-2 rounded-md border-2 border-paper/50 p-4">
            <span className="font-mono text-xs font-bold text-highlight">0{index + 1}</span>
            <span className="text-lg font-extrabold">{title}</span>
            <span className="text-base text-ground-soft">{text}</span>
          </li>
        ))}
      </ol>
    </AppPage>
  );
}
