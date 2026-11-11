import type { Metadata } from "next";
import { VerifyForm } from "@/components/auth/verify-form";

export const metadata: Metadata = { title: "Verify your account" };

export default function Page() {
  return <VerifyForm />;
}
