"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Link2, LogOut, MessagesSquare, UserRound } from "lucide-react";
import { cn } from "cn";
import { Logo } from "@/components/brand/logo";
import { usePendingCount } from "@/hooks/use-inbox";
import { useLogout } from "@/hooks/use-session";
import { prefetchOnIntent, usePrefetch } from "@/hooks/use-conversations";

const items = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/chats", label: "Chats", icon: MessagesSquare },
  { href: "/link", label: "My link", icon: Link2 },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

function PendingBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full border-2 border-ink bg-pop px-1.5 font-mono text-xs font-bold text-ink">
      {count}
      <span className="sr-only"> waiting</span>
    </span>
  );
}

// desktop: a sidebar. phones and tablets: a floating pill at the bottom
export function AppNav() {
  const isActive = useIsActive();
  const pending = usePendingCount();
  const logout = useLogout();
  const prefetch = usePrefetch();

  // the inbox is already loaded for the badge; load the chats list too, so the tab opens at once
  useEffect(() => {
    prefetch.conversations();
  }, [prefetch]);
  const intent = (href: string) => (href === "/chats" ? prefetchOnIntent(prefetch.conversations) : {});

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col gap-8 border-r-2 border-ink bg-ground px-5 py-6 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <Logo href="/inbox" className="px-3" />
        <nav aria-label="Main">
          <ul className="flex flex-col gap-1.5">
            {items.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  {...intent(href)}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-full border-2 px-4 text-base font-bold transition-colors",
                    isActive(href)
                      ? "border-ink bg-paper text-ink shadow-hard-sm [--focus-ring:var(--ink)]"
                      : "border-transparent text-paper hover:border-paper/40",
                  )}
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {label}
                  {href === "/inbox" && <PendingBadge count={pending} />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="mt-auto flex min-h-12 items-center gap-3 rounded-full px-4 text-base font-bold text-ground-soft hover:text-paper disabled:opacity-60"
        >
          <LogOut aria-hidden="true" className="size-5" />
          Sign out
        </button>
      </aside>

      <nav
        aria-label="Main"
        className="fixed inset-x-3 bottom-3 z-40 rounded-full border-2 border-ink bg-ink p-1.5 shadow-[4px_4px_0_var(--paper)] lg:hidden"
        style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
      >
        <ul className="grid grid-cols-4 gap-1">
          {items.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                {...intent(href)}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-full text-xs font-bold",
                  isActive(href) ? "bg-pop text-ink [--focus-ring:var(--paper)]" : "text-paper",
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
                {label}
                {href === "/inbox" && pending > 0 && (
                  <span className="absolute top-1 right-[18%] size-2.5 rounded-full border border-ink bg-highlight">
                    <span className="sr-only">{pending} waiting</span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
