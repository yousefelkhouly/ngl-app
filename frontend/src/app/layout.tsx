import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { SkipLink } from "@/components/layout/skip-link";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// self-hosted by next/font at build time: no request to Google from the browser
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "unsaid: anonymous notes, revealed only when you say yes",
    template: "%s · unsaid",
  },
  description:
    "Share your link and get anonymous notes. Senders stay redacted unless you choose to unredact them and start a chat.",
  openGraph: {
    type: "website",
    siteName: "unsaid",
    title: "unsaid",
    description: "Anonymous notes. The sender stays redacted until you say yes.",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f3dff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} ${jetbrainsMono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
