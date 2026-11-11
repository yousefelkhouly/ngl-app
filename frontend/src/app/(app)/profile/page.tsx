import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/profile-view";

export const metadata: Metadata = { title: "Profile" };

// see app/(app)/layout.tsx
export const instant = false;

export default function Page() {
  return <ProfileView />;
}
