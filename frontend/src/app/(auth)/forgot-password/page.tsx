import type { Metadata } from "next";
import { ForgotPasswordFlow } from "@/components/auth/forgot-password-flow";

export const metadata: Metadata = { title: "Reset your password" };

export default function Page() {
  return <ForgotPasswordFlow />;
}
