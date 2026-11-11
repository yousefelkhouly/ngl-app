import { Suspense } from "react";
import type { Metadata } from "next";
import { ChatView } from "@/components/chat/chat-view";
import { NotesSkeleton } from "@/components/common/states";

export const metadata: Metadata = { title: "Chat" };

// see app/(app)/layout.tsx
export const instant = false;

// the id is only known per request, so it's read behind a Suspense boundary
export default function Page({ params }: PageProps<"/chats/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-2xl">
          <NotesSkeleton count={2} />
        </div>
      }
    >
      {params.then(({ id }) => (
        <ChatView id={id} />
      ))}
    </Suspense>
  );
}
