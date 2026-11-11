"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { register } from "@/lib/api/auth";
import { ApiError, errorMessage } from "@/lib/api/client";
import { NAME_MAX, PASSWORD_MIN, registerSchema, type RegisterValues } from "@/lib/validation";
import { useSignedIn } from "@/hooks/use-session";
import { Input } from "@/components/ui/input";
import { FormError, FormField, fieldControlProps } from "@/components/common/form-field";
import { SubmitButton } from "@/components/common/submit-button";
import { AuthCard } from "./auth-card";
import { GoogleButton } from "./google-button";
import { PasswordInput } from "./password-input";
import { useFieldIds } from "@/hooks/use-field-ids";

export function RegisterForm() {
  const router = useRouter();
  const signedIn = useSignedIn();
  const ids = useFieldIds("name", "email", "password", "confirmPassword");
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: ({ name, email, password }: RegisterValues) => register({ name, email, password }),
    onSuccess: (_data, { email }) => {
      toast.success("Account created. We emailed you a code.");
      router.push(`/verify?email=${encodeURIComponent(email)}&sent=1`);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        form.setError("email", { message: "An account already uses this email." });
      }
    },
  });

  const duplicate = mutation.error instanceof ApiError && mutation.error.status === 409;

  return (
    <AuthCard
      title="Get your link"
      description="Make an account, share your link, and see what people never said out loud."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="underline decoration-2 underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-5">
        <FormField
          id={ids.name}
          label="Name"
          error={errors.name?.message}
          hint={`Shown to people you chat with. Up to ${NAME_MAX} characters.`}
        >
          <Input
            autoComplete="nickname"
            maxLength={NAME_MAX}
            {...fieldControlProps(ids.name, errors.name)}
            {...form.register("name")}
          />
        </FormField>
        <FormField id={ids.email} label="Email" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            {...fieldControlProps(ids.email, errors.email)}
            {...form.register("email")}
          />
        </FormField>
        <FormField
          id={ids.password}
          label="Password"
          error={errors.password?.message}
          hint={`At least ${PASSWORD_MIN} characters.`}
        >
          <PasswordInput
            autoComplete="new-password"
            {...fieldControlProps(ids.password, errors.password)}
            {...form.register("password")}
          />
        </FormField>
        <FormField id={ids.confirmPassword} label="Password again" error={errors.confirmPassword?.message}>
          <PasswordInput
            autoComplete="new-password"
            {...fieldControlProps(ids.confirmPassword, errors.confirmPassword)}
            {...form.register("confirmPassword")}
          />
        </FormField>
        <FormError message={mutation.error && !duplicate ? errorMessage(mutation.error) : null} />
        <SubmitButton variant="pop" size="lg" pending={mutation.isPending} pendingLabel="Creating…">
          Create account
        </SubmitButton>
      </form>
      <GoogleButton onSignedIn={() => signedIn("/inbox")} />
    </AuthCard>
  );
}
