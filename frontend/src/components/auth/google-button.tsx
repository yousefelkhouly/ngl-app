"use client";

import { useCallback, useRef, useState } from "react";
import Script from "next/script";
import { loginWithGoogle } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/client";
import { FormError } from "@/components/common/form-field";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Google's own "Continue with Google" button. hidden when no client id is configured,
// so the page never shows a button that can't work
export function GoogleButton({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const render = useCallback(() => {
    if (!clientId || !window.google || !container.current) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        setError(null);
        try {
          await loginWithGoogle(credential);
          await onSignedIn();
        } catch (failure) {
          setError(errorMessage(failure));
        }
      },
    });
    window.google.accounts.id.renderButton(container.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: container.current.offsetWidth,
    });
  }, [onSignedIn]);

  if (!clientId) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 font-mono text-xs font-bold text-ink-soft" aria-hidden="true">
        <span className="h-0.5 flex-1 bg-ink" />
        OR
        <span className="h-0.5 flex-1 bg-ink" />
      </div>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={render} />
      <div ref={container} className="min-h-11 w-full" />
      <FormError message={error} />
    </div>
  );
}
