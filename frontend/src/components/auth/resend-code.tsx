"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCooldown } from "@/hooks/use-cooldown";
import { Button } from "@/components/ui/button";

const RESEND_COOLDOWN_SECONDS = 60;

// "send a new code": asks the backend for one, then waits a minute before allowing another
export function useResendCode<TVariables = void>(
  send: (variables: TVariables) => Promise<unknown>,
  successMessage: string,
) {
  const cooldown = useCooldown(RESEND_COOLDOWN_SECONDS);
  const mutation = useMutation({
    mutationFn: send,
    onSuccess: () => {
      cooldown.start();
      toast.success(successMessage);
    },
  });
  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    remaining: cooldown.remaining,
  };
}

export function ResendCodeButton({
  resend,
  onClick,
  className,
}: {
  resend: { isPending: boolean; remaining: number };
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="link"
      className={className}
      onClick={onClick}
      disabled={resend.isPending || resend.remaining > 0}
    >
      {resend.remaining > 0 ? `Send a new code (${resend.remaining}s)` : "Send a new code"}
    </Button>
  );
}
