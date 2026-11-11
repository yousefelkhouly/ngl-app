import type { Metadata } from "next";
import { InboxView } from "@/components/inbox/inbox-view";

export const metadata: Metadata = { title: "Inbox" };

// see app/(app)/layout.tsx
export const instant = false;

export default function Page() {
  return <InboxView />;
}
