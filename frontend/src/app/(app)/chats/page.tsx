import type { Metadata } from "next";
import { ChatsList } from "@/components/chat/chats-list";

export const metadata: Metadata = { title: "Chats" };

// see app/(app)/layout.tsx
export const instant = false;

export default function Page() {
  return <ChatsList />;
}
