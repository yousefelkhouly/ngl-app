import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { RedactionBar } from "@/components/brand/redaction-bar";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col gap-10 px-4 py-6 sm:px-8 lg:px-14">
      <Logo />
      <div className="flex max-w-3xl flex-col gap-6 pt-10">
        <p className="font-mono text-sm font-bold tracking-wider text-ground-soft uppercase">Error 404</p>
        <h1 className="text-[clamp(3rem,8vw,6.5rem)] leading-[0.9] font-extrabold tracking-[-0.045em]">
          This page is <RedactionBar label="missing" className="w-[4em]" />.
        </h1>
        <p className="text-xl font-semibold">It doesn&apos;t exist, or it was never meant to be found.</p>
        <div>
          <Button asChild variant="pop" size="lg">
            <Link href="/">Back to the start</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
