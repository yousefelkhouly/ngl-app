"use client";

import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { m } from "motion/react";
import { sendMessage } from "@/lib/api/messages";
import { ApiError, errorMessage } from "@/lib/api/client";
import { CONTENT_MAX, isObjectId, sendMessageSchema, type SendMessageValues } from "@/lib/validation";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RedactionBar } from "@/components/brand/redaction-bar";
import { PaperNote } from "@/components/brand/paper-note";
import { FormError, fieldErrorId } from "@/components/common/form-field";
import { SubmitButton } from "@/components/common/submit-button";
import { EmptyState } from "@/components/common/states";
import { useFieldIds } from "@/hooks/use-field-ids";

export function SendView({ receiverId }: { receiverId: string }) {
  const { user: me, isPending: sessionPending } = useSession();

  if (!isObjectId(receiverId)) {
    return (
      <EmptyState
        title="This link doesn't work."
        action={
          <Button asChild variant="pop">
            <Link href="/register">Get your own link</Link>
          </Button>
        }
      >
        Check that you copied the whole link.
      </EmptyState>
    );
  }

  if (me?.id === receiverId) {
    return (
      <EmptyState
        title="This is your own link."
        action={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="pop">
              <Link href="/link">Share it</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/inbox">Open your inbox</Link>
            </Button>
          </div>
        }
      >
        Send it to friends. You can&apos;t leave yourself a note.
      </EmptyState>
    );
  }

  const signedIn = Boolean(me);

  return (
    <div className="flex flex-wrap items-center gap-x-16 gap-y-12">
      <section className="flex min-w-0 flex-[1_1_480px] flex-col gap-6">
        <h1 className="text-[clamp(3.5rem,9vw,8.5rem)] leading-[0.86] font-extrabold tracking-[-0.045em]">
          Say it.
        </h1>
        <p className="max-w-xl text-xl leading-snug font-semibold sm:text-2xl">
          {signedIn ? (
            <>
              You&apos;ll stay <RedactionBar label="anonymous" className="w-[6em]" /> unless they decide to let you
              in.
            </>
          ) : (
            <>
              No account needed. Without one, you stay <RedactionBar label="anonymous" className="w-[6em]" /> for
              good.
            </>
          )}
        </p>
      </section>
      <div className="relative min-w-0 flex-[1_1_400px] sm:max-w-xl">
        {!sessionPending && !signedIn && (
          <span
            aria-hidden="true"
            className="absolute -top-8 -right-2 z-10 flex size-24 rotate-12 items-center justify-center rounded-full border-2 border-ink bg-highlight text-center font-mono text-[11px] leading-tight font-bold text-ink"
          >
            NO
            <br />
            ACCOUNT
            <br />
            NEEDED
          </span>
        )}
        <SendForm receiverId={receiverId} signedIn={signedIn} signedInAs={me?.name} />
      </div>
    </div>
  );
}

function SendForm({
  receiverId,
  signedIn,
  signedInAs,
}: {
  receiverId: string;
  signedIn: boolean;
  signedInAs?: string;
}) {
  const ids = useFieldIds("content", "revealable", "revealable-hint", "content-count");
  const form = useForm<SendMessageValues>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: { content: "", revealable: true },
  });
  const { errors } = form.formState;
  const length = useWatch({ control: form.control, name: "content" }).length;

  const mutation = useMutation({
    mutationFn: (values: SendMessageValues) =>
      sendMessage({
        content: values.content,
        receiver: receiverId,
        // without an account there's nobody to reveal
        revealable: signedIn && values.revealable,
      }),
  });

  if (mutation.isSuccess) {
    const revealable = mutation.variables.revealable && signedIn;
    return (
      <m.div initial={{ opacity: 0, rotate: -3, y: 12 }} animate={{ opacity: 1, rotate: -1, y: 0 }}>
        <PaperNote tape className="flex flex-col gap-4 p-6 sm:p-8" role="status">
          <p className="font-mono text-xs font-bold tracking-wider uppercase">Sealed and delivered</p>
          <p className="text-3xl leading-tight font-extrabold tracking-tight">Your note is in their inbox.</p>
          <p className="text-base leading-relaxed text-ink-soft">
            {revealable
              ? "You stay redacted unless they choose to unredact you. If they do, a chat opens in your Chats."
              : "Nobody, not even them, can find out it was you."}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                form.reset({ content: "", revealable: mutation.variables.revealable });
                mutation.reset();
              }}
            >
              Send another
            </Button>
            <Button asChild variant="pop">
              <Link href={signedIn ? "/link" : "/register"}>Get your own link</Link>
            </Button>
          </div>
        </PaperNote>
      </m.div>
    );
  }

  const notFound = mutation.error instanceof ApiError && mutation.error.status === 404;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="paper relative flex -rotate-1 flex-col gap-5 p-5 shadow-hard-lg sm:p-7"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={ids.content}>Your note</Label>
        <textarea
          id={ids.content}
          rows={5}
          maxLength={CONTENT_MAX}
          placeholder="the thing you keep almost saying…"
          aria-invalid={errors.content ? true : undefined}
          aria-describedby={errors.content ? fieldErrorId(ids.content) : ids["content-count"]}
          {...form.register("content")}
          className="lined w-full resize-none border-0 border-b-2 border-ink bg-transparent px-1 py-0 text-xl font-bold text-ink placeholder:font-semibold placeholder:text-ink-soft focus-visible:outline-offset-4"
        />
        <div className="flex items-start justify-between gap-3">
          <p id={fieldErrorId(ids.content)} className="text-sm font-bold text-danger">
            {errors.content?.message}
          </p>
          <span id={ids["content-count"]} className="shrink-0 font-mono text-xs font-bold text-ink-soft">
            {length} / {CONTENT_MAX}
          </span>
        </div>
      </div>

      {signedIn && (
        <div className="flex items-start gap-3 rounded-md border-2 border-dashed border-ink p-4">
          <Controller
            control={form.control}
            name="revealable"
            render={({ field }) => (
              <Checkbox
                id={ids.revealable}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-describedby={ids["revealable-hint"]}
                className="mt-0.5"
              />
            )}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor={ids.revealable} className="text-base font-extrabold">
              Let them unredact me
            </label>
            <p id={ids["revealable-hint"]} className="text-sm leading-relaxed text-ink-soft">
              Only if they accept your note. Unchecked, you stay hidden forever.
            </p>
          </div>
        </div>
      )}

      <FormError
        message={
          notFound
            ? "This link doesn't belong to anyone anymore."
            : mutation.error
              ? errorMessage(mutation.error)
              : null
        }
      />
      <SubmitButton variant="pop" size="lg" pending={mutation.isPending} pendingLabel="Sending…">
        Send it, anonymously
      </SubmitButton>
      <p className="text-center font-mono text-xs font-bold text-ink-soft uppercase">
        {signedIn ? (
          <>Signed in as {signedInAs}</>
        ) : (
          <>
            Have an account?{" "}
            <Link href={`/login?next=${encodeURIComponent(`/u/${receiverId}`)}`} className="text-ink underline underline-offset-4">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
