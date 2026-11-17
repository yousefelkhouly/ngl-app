"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api/client";
import type { Profile } from "@/lib/api/types";
import {
  changePasswordSchema,
  codeSchema,
  emailSchema,
  profileDetailsSchema,
  type ChangePasswordValues,
  type CodeValues,
  type EmailValues,
  type ProfileDetailsValues,
} from "@/lib/validation";
import {
  useChangePassword,
  useConfirmEmailChange,
  useDeleteAccount,
  useRequestEmailChange,
  useUpdateProfile,
} from "@/hooks/use-profile";
import { useFieldIds } from "@/hooks/use-field-ids";
import { Input } from "@/components/ui/input";
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
import { FormError, FormField, fieldControlProps } from "@/components/common/form-field";
import { SubmitButton } from "@/components/common/submit-button";
import { PaperNote } from "@/components/brand/paper-note";
import { CodeField } from "@/components/auth/code-field";
import { PasswordInput } from "@/components/auth/password-input";
import { codeStepError } from "@/components/auth/code-errors";

// name, username, email, password, and deleting the account
export function AccountCard({ profile }: { profile: Profile }) {
  return (
    <PaperNote as="section" id="account" aria-labelledby="account-title" className="flex scroll-mt-6 flex-col gap-6 p-5 sm:p-6">
      <h2 id="account-title" className="text-2xl font-extrabold tracking-tight">
        Account
      </h2>
      <DetailsForm profile={profile} />
      <Section title="Email">
        <EmailForm email={profile.email} />
      </Section>
      <Section title="Password">
        <PasswordForm hasPassword={profile.hasPassword} />
      </Section>
      <Section title="Delete account">
        <DeleteAccount hasPassword={profile.hasPassword} />
      </Section>
    </PaperNote>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t-2 border-rule pt-5">
      <h3 className="text-lg font-extrabold">{title}</h3>
      {children}
    </div>
  );
}

function DetailsForm({ profile }: { profile: Profile }) {
  const ids = useFieldIds("name", "username");
  const update = useUpdateProfile();
  const form = useForm<ProfileDetailsValues>({
    resolver: zodResolver(profileDetailsSchema),
    values: { name: profile.name, username: profile.username },
  });
  const { errors, isDirty } = form.formState;
  const usernameTaken = update.error instanceof ApiError && update.error.status === 409;

  const submit = form.handleSubmit((values) => {
    // only what changed: an unchanged username isn't checked again
    const changes: Partial<ProfileDetailsValues> = {};
    if (values.name !== profile.name) changes.name = values.name;
    if (values.username !== profile.username) changes.username = values.username;
    update.mutate(changes, { onSuccess: () => toast.success("Saved.") });
  });

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={ids.name} label="Name" error={errors.name?.message}>
          <Input autoComplete="nickname" {...fieldControlProps(ids.name, errors.name)} {...form.register("name")} />
        </FormField>
        <FormField
          id={ids.username}
          label="Username"
          error={errors.username?.message ?? (usernameTaken ? "That username is taken. Try another." : undefined)}
          hint="Your link ends with it. Old links keep working."
        >
          <Input
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            {...fieldControlProps(ids.username, errors.username ?? (usernameTaken || undefined))}
            {...form.register("username")}
          />
        </FormField>
      </div>
      <FormError message={update.error && !usernameTaken ? errorMessage(update.error) : null} />
      <div>
        <SubmitButton variant="outline" size="sm" pending={update.isPending} pendingLabel="Saving…" disabled={!isDirty}>
          Save name and username
        </SubmitButton>
      </div>
    </form>
  );
}

function EmailForm({ email }: { email: string }) {
  // the new address waiting for its code
  const [pending, setPending] = useState<string | null>(null);
  const ids = useFieldIds("email", "code");
  const request = useRequestEmailChange();
  const confirm = useConfirmEmailChange();
  const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });
  const codeForm = useForm<CodeValues>({ resolver: zodResolver(codeSchema), defaultValues: { code: "" } });

  const ask = emailForm.handleSubmit(({ email: next }) =>
    request.mutate(next, { onSuccess: () => setPending(next) }),
  );
  const submitCode = codeForm.handleSubmit(({ code }) =>
    confirm.mutate(code, {
      onSuccess: () => {
        toast.success("Email changed.");
        setPending(null);
        emailForm.reset();
        codeForm.reset();
      },
      onError: () => codeForm.resetField("code"),
    }),
  );

  if (pending) {
    return (
      <form noValidate onSubmit={submitCode} className="flex flex-col gap-4">
        <p className="text-base">
          We sent a 6-digit code to <strong>{pending}</strong>. Enter it to move your account there.
        </p>
        <CodeField
          id={ids.code}
          control={codeForm.control}
          name="code"
          error={codeForm.formState.errors.code?.message}
          disabled={confirm.isPending}
          onComplete={() => void submitCode()}
        />
        <FormError message={codeStepError(confirm.error, null)} />
        <div className="flex flex-wrap gap-3">
          <SubmitButton variant="pop" size="sm" pending={confirm.isPending} pendingLabel="Saving…">
            Change email
          </SubmitButton>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setPending(null);
              confirm.reset();
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form noValidate onSubmit={ask} className="flex flex-col gap-4">
      <p className="text-base text-ink-soft">
        You sign in with <strong className="text-ink">{email}</strong>. To change it, we&apos;ll send a code to the new
        address first.
      </p>
      <FormField id={ids.email} label="New email" error={emailForm.formState.errors.email?.message}>
        <Input
          type="email"
          autoComplete="email"
          {...fieldControlProps(ids.email, emailForm.formState.errors.email)}
          {...emailForm.register("email")}
        />
      </FormField>
      <FormError message={request.error ? errorMessage(request.error) : null} />
      <div>
        <SubmitButton variant="outline" size="sm" pending={request.isPending} pendingLabel="Sending code…">
          Send a code to the new email
        </SubmitButton>
      </div>
    </form>
  );
}

function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const ids = useFieldIds("current", "new", "confirm");
  const change = useChangePassword();
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  const submit = form.handleSubmit(({ currentPassword, newPassword }) => {
    if (hasPassword && !currentPassword) {
      form.setError("currentPassword", { message: "Enter your current password" });
      return;
    }
    change.mutate(
      { currentPassword: hasPassword ? currentPassword : undefined, newPassword },
      {
        onSuccess: () => {
          toast.success(hasPassword ? "Password changed. Other devices are signed out." : "Password set.");
          form.reset();
        },
      },
    );
  });

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-base text-ink-soft">
        {hasPassword
          ? "Changing it signs you out everywhere else."
          : "You sign in with Google. Set a password to also sign in with your email."}
      </p>
      {hasPassword && (
        <FormField id={ids.current} label="Current password" error={errors.currentPassword?.message}>
          <PasswordInput
            autoComplete="current-password"
            {...fieldControlProps(ids.current, errors.currentPassword)}
            {...form.register("currentPassword")}
          />
        </FormField>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={ids.new} label="New password" error={errors.newPassword?.message}>
          <PasswordInput
            autoComplete="new-password"
            {...fieldControlProps(ids.new, errors.newPassword)}
            {...form.register("newPassword")}
          />
        </FormField>
        <FormField id={ids.confirm} label="New password again" error={errors.confirmPassword?.message}>
          <PasswordInput
            autoComplete="new-password"
            {...fieldControlProps(ids.confirm, errors.confirmPassword)}
            {...form.register("confirmPassword")}
          />
        </FormField>
      </div>
      <FormError message={change.error ? errorMessage(change.error) : null} />
      <div>
        <SubmitButton variant="outline" size="sm" pending={change.isPending} pendingLabel="Saving…">
          {hasPassword ? "Change password" : "Set password"}
        </SubmitButton>
      </div>
    </form>
  );
}

function DeleteAccount({ hasPassword }: { hasPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const ids = useFieldIds("password", "confirm");
  const remove = useDeleteAccount();
  const ready = confirmText.trim().toUpperCase() === "DELETE" && (!hasPassword || password.length > 0);

  return (
    <>
      <p className="text-base text-ink-soft">
        Your notes, profile, pictures and files are removed for good. People you chat with see &quot;deleted
        account&quot;.
      </p>
      <div>
        <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
          Delete my account
        </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            remove.reset();
            setPassword("");
            setConfirmText("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>This can&apos;t be undone. Type DELETE to confirm.</DialogDescription>
          </DialogHeader>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!ready) return;
              remove.mutate(hasPassword ? password : undefined, {
                onSuccess: () => toast.success("Your account is deleted."),
              });
            }}
          >
            {hasPassword && (
              <FormField id={ids.password} label="Your password">
                <PasswordInput
                  id={ids.password}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </FormField>
            )}
            <FormField id={ids.confirm} label="Type DELETE">
              <Input
                id={ids.confirm}
                autoComplete="off"
                autoCapitalize="characters"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
              />
            </FormField>
            <FormError message={remove.error ? errorMessage(remove.error) : null} />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <SubmitButton
                variant="destructive"
                pending={remove.isPending || remove.isSuccess}
                pendingLabel="Deleting…"
                disabled={!ready}
              >
                Delete for good
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
