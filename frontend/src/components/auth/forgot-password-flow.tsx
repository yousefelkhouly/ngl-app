"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { resetPassword, sendOtp } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/client";
import {
  PASSWORD_MIN,
  emailSchema,
  resetPasswordSchema,
  type EmailValues,
  type ResetPasswordValues,
} from "@/lib/validation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError, FormField, fieldControlProps } from "@/components/common/form-field";
import { SubmitButton } from "@/components/common/submit-button";
import { AuthCard } from "./auth-card";
import { CodeField } from "./code-field";
import { PasswordInput } from "./password-input";
import { ResendCodeButton, useResendCode } from "./resend-code";
import { codeStepError } from "./code-errors";
import { useFieldIds } from "@/hooks/use-field-ids";

export function ForgotPasswordFlow() {
  const [email, setEmail] = useState<string | null>(null);
  // start over when the page is hidden: Next keeps visited pages mounted
  useLayoutEffect(() => () => setEmail(null), []);
  return email ? (
    <ResetStep email={email} onBack={() => setEmail(null)} />
  ) : (
    <EmailStep onSent={setEmail} />
  );
}

const backToLogin = (
  <Link href="/login" className="underline decoration-2 underline-offset-4">
    Back to sign in
  </Link>
);

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const ids = useFieldIds("email");
  const form = useForm<EmailValues>({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });
  const { errors } = form.formState;
  const mutation = useMutation({
    mutationFn: ({ email }: EmailValues) => sendOtp(email),
    onSuccess: (_data, { email }) => onSent(email),
  });

  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email and we'll send you a code to set a new one."
      footer={backToLogin}
    >
      <form noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-5">
        <FormField id={ids.email} label="Email" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            {...fieldControlProps(ids.email, errors.email)}
            {...form.register("email")}
          />
        </FormField>
        <FormError message={mutation.error ? errorMessage(mutation.error) : null} />
        <SubmitButton variant="pop" size="lg" pending={mutation.isPending} pendingLabel="Sending…">
          Send me a code
        </SubmitButton>
      </form>
    </AuthCard>
  );
}

function ResetStep({ email, onBack }: { email: string; onBack: () => void }) {
  const router = useRouter();
  const ids = useFieldIds("code", "newPassword", "confirmPassword");
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  const reset = useMutation({
    mutationFn: ({ code, newPassword }: ResetPasswordValues) => resetPassword(email, code, newPassword),
    onSuccess: () => {
      toast.success("Password changed. You've been signed out everywhere, so sign in again.");
      router.push(`/login?email=${encodeURIComponent(email)}`);
    },
    // empty the boxes: the code input can't overwrite a full code with a new one
    onError: () => form.resetField("code"),
  });

  const resend = useResendCode(() => sendOtp(email), "If that email has an account, a new code is on its way.");

  return (
    <AuthCard
      title="Set a new password"
      description={
        <>
          If <strong className="text-ink">{email}</strong> has an account, we emailed it a 6-digit code.
        </>
      }
      footer={backToLogin}
    >
      <form noValidate onSubmit={form.handleSubmit((values) => reset.mutate(values))} className="flex flex-col gap-5">
        <CodeField
          id={ids.code}
          control={form.control}
          name="code"
          error={errors.code?.message}
          disabled={reset.isPending}
        />
        <FormField
          id={ids.newPassword}
          label="New password"
          error={errors.newPassword?.message}
          hint={`At least ${PASSWORD_MIN} characters.`}
        >
          <PasswordInput
            autoComplete="new-password"
            {...fieldControlProps(ids.newPassword, errors.newPassword)}
            {...form.register("newPassword")}
          />
        </FormField>
        <FormField id={ids.confirmPassword} label="New password again" error={errors.confirmPassword?.message}>
          <PasswordInput
            autoComplete="new-password"
            {...fieldControlProps(ids.confirmPassword, errors.confirmPassword)}
            {...form.register("confirmPassword")}
          />
        </FormField>
        <FormError message={codeStepError(reset.error, resend.error)} />
        <SubmitButton variant="pop" size="lg" pending={reset.isPending} pendingLabel="Saving…">
          Save new password
        </SubmitButton>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="link" onClick={onBack}>
          Use a different email
        </Button>
        <ResendCodeButton resend={resend} onClick={() => resend.mutate()} />
      </div>
    </AuthCard>
  );
}
