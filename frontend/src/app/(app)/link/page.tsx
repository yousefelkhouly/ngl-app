import type { Metadata } from "next";
import { LinkView } from "@/components/profile/link-view";

export const metadata: Metadata = { title: "Your link" };

// see app/(app)/layout.tsx
export const instant = false;

export default function Page() {
  return <LinkView />;
}
