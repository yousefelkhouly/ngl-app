"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { sendOtp, verifyAccount } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { emailSchema, verifySchema, type VerifyValues } from "@/lib/validation";
import { Input } from "@/components/ui/input";
import { FormError, FormField, fieldControlProps } from "@/components/common/form-field";
import { SubmitButton } from "@/components/common/submit-button";
import { AuthCard } from "./auth-card";
import { CodeField } from "./code-field";
import { ResendCodeButton, useResendCode } from "./resend-code";
import { codeStepError } from "./code-errors";
import { useFieldIds } from "@/hooks/use-field-ids";

export function VerifyForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  // a fresh form for each ?email=, see LoginFlow
  return <VerifySteps key={email} defaultEmail={email} justSent={searchParams.get("sent") === "1"} />;
}

function VerifySteps({ defaultEmail, justSent }: { defaultEmail: string; justSent: boolean }) {
  const router = useRouter();

  const ids = useFieldIds("email", "code");
  const form = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { email: defaultEmail, code: "" },
  });
  const { errors } = form.formState;

  const verify = useMutation({
    mutationFn: ({ email, code }: VerifyValues) => verifyAccount(email, code),
    onSuccess: (_data, { email }) => {
      toast.success("Account verified. Sign in to open your inbox.");
      router.push(`/login?email=${encodeURIComponent(email)}`);
    },
    // empty the boxes: the code input can't overwrite a full code with a new one
    onError: () => form.resetField("code"),
  });

  const resend = useResendCode(
    (email: string) => sendOtp(email),
    "If that email has an account, a new code is on its way.",
  );

  const requestCode = async () => {
    const valid = await form.trigger("email");
    if (valid) resend.mutate(emailSchema.parse({ email: form.getValues("email") }).email);
  };

  const submit = form.handleSubmit((values) => verify.mutate(values));
  const alreadyVerified =
    verify.error instanceof ApiError && verify.error.message.toLowerCase() === "user already verified";

  return (
    <AuthCard
      title="Verify your account"
      description={
        justSent
          ? "We emailed you a 6-digit code. Enter it below to activate your account."
          : "Enter the 6-digit code we emailed you. No code? Send yourself a new one."
      }
      footer={
        <Link href="/login" className="underline decoration-2 underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        <FormField id={ids.email} label="Email" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            {...fieldControlProps(ids.email, errors.email)}
            {...form.register("email")}
          />
        </FormField>
        <CodeField
          id={ids.code}
          control={form.control}
          name="code"
          error={errors.code?.message}
          disabled={verify.isPending}
          onComplete={() => void submit()}
        />
        {alreadyVerified ? (
          <p role="alert" className="rounded-md border-2 border-ink bg-highlight px-4 py-3 text-sm font-bold">
            This account is already verified.{" "}
            <Link href={`/login?email=${encodeURIComponent(form.getValues("email"))}`} className="underline underline-offset-4">
              Sign in
            </Link>
          </p>
        ) : (
          <FormError message={codeStepError(verify.error, resend.error)} />
        )}
        <SubmitButton variant="pop" size="lg" pending={verify.isPending} pendingLabel="Verifying…">
          Verify account
        </SubmitButton>
      </form>
      <ResendCodeButton resend={resend} className="self-start" onClick={() => void requestCode()} />
    </AuthCard>
  );
}
