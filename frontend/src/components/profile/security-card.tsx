"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { requestTwoStepCode } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/client";
import { codeSchema, type CodeValues } from "@/lib/validation";
import type { Profile } from "@/lib/api/types";
import { useSetTwoStep, useUnblockEveryone } from "@/hooks/use-profile";
import { useFieldIds } from "@/hooks/use-field-ids";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/common/form-field";
import { SubmitButton } from "@/components/common/submit-button";
import { PaperNote } from "@/components/brand/paper-note";
import { CodeField } from "@/components/auth/code-field";
import { ResendCodeButton, useResendCode } from "@/components/auth/resend-code";
import { codeStepError } from "@/components/auth/code-errors";

// 2-step verification on or off, and the people you blocked
export function SecurityCard({ profile }: { profile: Profile }) {
  return (
    <PaperNote as="section" aria-labelledby="security-title" className="flex flex-col gap-5 p-5 sm:p-6">
      <h2 id="security-title" className="text-2xl font-extrabold tracking-tight">
        Security and privacy
      </h2>
      <TwoStep enabled={profile.twoStepVerification} />
      <Blocked count={profile.blockedCount} />
    </PaperNote>
  );
}

function TwoStep({ enabled }: { enabled: boolean }) {
  // the change waiting for its emailed code
  const [pending, setPending] = useState<boolean | null>(null);
  const resend = useResendCode((target: boolean) => requestTwoStepCode(target), "Code sent. Check your email.");

  const start = () => {
    const target = !enabled;
    resend.mutate(target, { onSuccess: () => setPending(target) });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-extrabold">
            2-step verification: <span className="bg-highlight px-1.5">{enabled ? "On" : "Off"}</span>
          </h3>
          <p className="text-base text-ink-soft">
            {enabled
              ? "Every sign-in with your password also asks for a code we email you."
              : "Turn it on to be asked for an emailed code, as well as your password, when you sign in."}
          </p>
        </div>
        {pending === null && (
          <Button variant="outline" size="sm" onClick={start} disabled={resend.isPending}>
            {resend.isPending ? "Sending code…" : enabled ? "Turn off" : "Turn on"}
          </Button>
        )}
      </div>
      {pending === null ? (
        <FormError message={resend.error ? errorMessage(resend.error) : null} />
      ) : (
        <ConfirmTwoStep
          target={pending}
          resend={resend}
          onResend={() => resend.mutate(pending)}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
}

function ConfirmTwoStep({
  target,
  resend,
  onResend,
  onClose,
}: {
  target: boolean;
  resend: { isPending: boolean; remaining: number; error: unknown };
  onResend: () => void;
  onClose: () => void;
}) {
  const ids = useFieldIds("two-step-code");
  const setTwoStep = useSetTwoStep();
  const form = useForm<CodeValues>({ resolver: zodResolver(codeSchema), defaultValues: { code: "" } });
  const { errors } = form.formState;

  const submit = form.handleSubmit(({ code }) =>
    setTwoStep.mutate(
      { enabled: target, code },
      {
        onSuccess: () => {
          toast.success(target ? "2-step verification is on." : "2-step verification is off.");
          onClose();
        },
        onError: () => form.resetField("code"),
      },
    ),
  );

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4 rounded-md border-2 border-dashed border-ink p-4">
      <p className="text-base font-semibold">
        Enter the 6-digit code we emailed you to turn 2-step verification {target ? "on" : "off"}.
      </p>
      <CodeField
        id={ids["two-step-code"]}
        control={form.control}
        name="code"
        error={errors.code?.message}
        disabled={setTwoStep.isPending}
        onComplete={() => void submit()}
      />
      <FormError message={codeStepError(setTwoStep.error, resend.error)} />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton variant="pop" size="sm" pending={setTwoStep.isPending} pendingLabel="Saving…">
          {target ? "Turn on" : "Turn off"}
        </SubmitButton>
        <Button variant="outline" size="sm" type="button" onClick={onClose}>
          Cancel
        </Button>
        <ResendCodeButton resend={resend} onClick={onResend} className="ml-auto" />
      </div>
    </form>
  );
}

function Blocked({ count }: { count: number }) {
  const unblock = useUnblockEveryone();

  return (
    <div className="flex flex-col gap-3 border-t-2 border-rule pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-extrabold">Blocked</h3>
          <p className="text-base text-ink-soft">
            {count === 0
              ? "You haven't blocked anyone. Block a sender from a note's ⋯ menu, or from a chat."
              : `You blocked ${count} ${count === 1 ? "person" : "people"}. Who they are stays hidden, even from you.`}
          </p>
        </div>
        {count > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={unblock.isPending}
            onClick={() =>
              unblock.mutate(undefined, { onSuccess: () => toast.success("Everyone is unblocked.") })
            }
          >
            {unblock.isPending ? "Unblocking…" : "Unblock everyone"}
          </Button>
        )}
      </div>
      <FormError message={unblock.error ? errorMessage(unblock.error) : null} />
    </div>
  );
}
