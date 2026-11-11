import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Get your link" };

export default function Page() {
  return <RegisterForm />;
}
