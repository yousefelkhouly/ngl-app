"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { enableTwoStepVerification, login, verifyCodeToLogin } from "@/lib/api/auth";
import { ApiError, errorMessage } from "@/lib/api/client";
import { safeNextPath } from "@/lib/format";
import { codeSchema, loginSchema, type CodeValues, type LoginValues } from "@/lib/validation";
import { useSignedIn } from "@/hooks/use-session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError, FormField, fieldControlProps } from "@/components/common/form-field";
import { SubmitButton } from "@/components/common/submit-button";
import { AuthCard } from "./auth-card";
import { CodeField } from "./code-field";
import { GoogleButton } from "./google-button";
import { PasswordInput } from "./password-input";
import { ResendCodeButton, useResendCode } from "./resend-code";
import { codeStepError } from "./code-errors";
import { useFieldIds } from "@/hooks/use-field-ids";

interface CodeSent {
  email: string;
  password: string;
  twoStepEnabled: boolean;
}

// the backend never logs in from a password alone: it emails a code first.
// step 1 checks the password, step 2 takes the code
export function LoginFlow() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  // Next keeps visited pages mounted: a new ?email= (after verifying, after a reset)
  // must start a fresh form instead of showing the old one
  return <LoginSteps key={email} defaultEmail={email} next={safeNextPath(searchParams.get("next"))} />;
}

function LoginSteps({ defaultEmail, next }: { defaultEmail: string; next: string }) {
  const signedIn = useSignedIn();
  const [codeSent, setCodeSent] = useState<CodeSent | null>(null);

  // forget this attempt (and the password kept for "send a new code") when the page is hidden
  useLayoutEffect(() => () => setCodeSent(null), []);

  if (codeSent) {
    return (
      <CodeStep
        {...codeSent}
        onBack={() => setCodeSent(null)}
        onDone={() => signedIn(next)}
      />
    );
  }
  return (
    <CredentialsStep
      defaultEmail={defaultEmail}
      onCodeSent={setCodeSent}
      onGoogleSignedIn={() => signedIn(next)}
    />
  );
}

function CredentialsStep({
  defaultEmail,
  onCodeSent,
  onGoogleSignedIn,
}: {
  defaultEmail: string;
  onCodeSent: (sent: CodeSent) => void;
  onGoogleSignedIn: () => Promise<void>;
}) {
  const ids = useFieldIds("email", "password");
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail, password: "" },
  });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => login(values.email, values.password),
    onSuccess: ({ twoStepEnabled }, values) => onCodeSent({ ...values, twoStepEnabled }),
  });

  const unverified =
    mutation.error instanceof ApiError && mutation.error.status === 403 ? form.getValues("email") : null;

  return (
    <AuthCard
      title="Welcome back"
      description="We'll email you a 6-digit code to finish signing in."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="underline decoration-2 underline-offset-4">
            Create your link
          </Link>
        </>
      }
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
        <FormField id={ids.password} label="Password" error={errors.password?.message}>
          <PasswordInput
            autoComplete="current-password"
            {...fieldControlProps(ids.password, errors.password)}
            {...form.register("password")}
          />
        </FormField>
        <Link href="/forgot-password" className="-mt-2 self-end text-sm font-bold underline decoration-2 underline-offset-4">
          Forgot your password?
        </Link>

        {unverified ? (
          <p role="alert" className="rounded-md border-2 border-ink bg-highlight px-4 py-3 text-sm font-bold">
            This account isn&apos;t verified yet.{" "}
            <Link href={`/verify?email=${encodeURIComponent(unverified)}`} className="underline underline-offset-4">
              Verify it now
            </Link>
          </p>
        ) : (
          <FormError message={mutation.error ? errorMessage(mutation.error) : null} />
        )}

        <SubmitButton variant="pop" size="lg" pending={mutation.isPending} pendingLabel="Checking…">
          Send me a code
        </SubmitButton>
      </form>
      <GoogleButton onSignedIn={onGoogleSignedIn} />
    </AuthCard>
  );
}

function CodeStep({
  email,
  password,
  twoStepEnabled,
  onBack,
  onDone,
}: CodeSent & { onBack: () => void; onDone: () => Promise<void> }) {
  const ids = useFieldIds("code");
  const form = useForm<CodeValues>({ resolver: zodResolver(codeSchema), defaultValues: { code: "" } });
  const { errors } = form.formState;

  // without 2-step verification the code goes to the endpoint that turns it on
  const verify = useMutation({
    mutationFn: ({ code }: CodeValues) =>
      twoStepEnabled ? verifyCodeToLogin(email, code) : enableTwoStepVerification(email, code),
    onSuccess: async () => {
      if (!twoStepEnabled) toast.success("2-step verification is on. You're signed in.");
      await onDone();
    },
    // empty the boxes: the code input can't overwrite a full code with a new one
    onError: () => form.resetField("code"),
  });

  const resend = useResendCode(() => login(email, password), "New code sent. Check your email.");

  const submit = form.handleSubmit((values) => verify.mutate(values));

  return (
    <AuthCard
      title="Check your email"
      description={
        <>
          We sent a 6-digit code to <strong className="text-ink">{email}</strong>.
          {!twoStepEnabled && " Using it also turns on 2-step verification, so every sign-in asks for a code."}
        </>
      }
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        <CodeField
          id={ids.code}
          control={form.control}
          name="code"
          error={errors.code?.message}
          disabled={verify.isPending}
          onComplete={() => void submit()}
        />
        <FormError message={codeStepError(verify.error, resend.error)} />
        <SubmitButton variant="pop" size="lg" pending={verify.isPending || verify.isSuccess} pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="link" onClick={onBack}>
          Use a different account
        </Button>
        <ResendCodeButton resend={resend} onClick={() => resend.mutate()} />
      </div>
    </AuthCard>
  );
}
