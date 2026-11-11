import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { RedactionBar } from "@/components/brand/redaction-bar";
import { Stamp } from "@/components/brand/stamp";

const steps = [
  {
    title: "Share your link",
    text: "Post it anywhere. Anyone who opens it can leave you a note, with or without an account.",
  },
  {
    title: "Read what they wrote",
    text: "Every note arrives with the sender blurred out. Nobody knows you've read it.",
  },
  {
    title: "Unredact, or don't",
    text: "If a note came from someone with an account, you decide whether to see who, and start a chat.",
  },
];

// a decorative stack of notes showing the idea; the real ones live in the inbox
function ExampleNotes() {
  return (
    <div aria-hidden="true" className="relative flex flex-col gap-7 text-ink">
      <div className="paper relative -rotate-2 p-5 shadow-hard-lg">
        <Stamp tone="pop" className="absolute -top-3.5 right-4">
          Can unredact
        </Stamp>
        <p className="flex items-center gap-2 font-mono text-xs font-bold">
          FROM <RedactionBar label="" className="h-4 w-28" />
        </p>
        <p className="mt-3 text-2xl leading-snug font-bold tracking-tight">
          honestly your presentation today was the best one
        </p>
      </div>
      <div className="paper relative ml-6 rotate-1 p-5 shadow-hard-lg">
        <Stamp tone="highlight" className="absolute -top-3.5 right-6 -rotate-3">
          Unredacted
        </Stamp>
        <p className="flex items-center gap-2 font-mono text-xs font-bold">
          FROM <span className="bg-highlight px-1.5 font-sans text-base font-extrabold">Omar A.</span>
        </p>
        <p className="mt-3 text-2xl leading-snug font-bold tracking-tight">I meant it though. you were really good</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section className="flex flex-wrap items-center gap-x-16 gap-y-14 px-4 pt-8 pb-20 sm:px-8 lg:px-14 lg:pt-16">
          <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-7">
            <h1 className="text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.88] font-extrabold tracking-[-0.045em]">
              Things people didn&apos;t say out loud.
            </h1>
            <p className="max-w-xl text-xl leading-snug font-semibold sm:text-2xl">
              Get anonymous notes from anyone. The sender stays{" "}
              <RedactionBar label="hidden" className="w-[5.5em]" /> until you decide to unredact them.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="pop" size="lg">
                <Link href="/register">Get your link</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
          <div className="min-w-0 flex-[1_1_380px] sm:max-w-lg">
            <ExampleNotes />
          </div>
        </section>

        <section aria-labelledby="how-title" className="border-t-2 border-ink bg-paper px-4 py-16 text-ink sm:px-8 lg:px-14">
          <h2 id="how-title" className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            How it works
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-3 border-t-2 border-ink pt-5">
                <span className="font-mono text-sm font-bold">0{index + 1}</span>
                <h3 className="text-2xl font-extrabold tracking-tight">{step.title}</h3>
                <p className="text-lg leading-relaxed text-ink-soft">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 bg-ink px-4 py-6 font-mono text-xs font-bold tracking-wider text-paper uppercase sm:px-8 lg:px-14">
          <span>unsaid</span>
          <span>Anonymous until you say yes</span>
        </footer>
      </main>
    </>
  );
}
