import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SendView } from "@/components/send/send-view";
import { NotesSkeleton } from "@/components/common/states";

export const metadata: Metadata = {
  title: "Send an anonymous note",
  description: "Leave an anonymous note. You stay redacted unless they choose to unredact you.",
  // links are personal: keep them out of search results
  robots: { index: false, follow: false },
};

export default function Page({ params }: PageProps<"/u/[id]">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-4 pt-6 pb-20 sm:px-8 lg:px-14 lg:pt-12">
        <Suspense fallback={<NotesSkeleton count={1} className="mx-auto max-w-xl" />}>
          {params.then(({ id }) => (
            <SendView receiverId={id} />
          ))}
        </Suspense>
      </main>
    </>
  );
}
