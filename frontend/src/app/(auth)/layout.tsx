import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { RedactionBar } from "@/components/brand/redaction-bar";
import { RedirectIfSignedIn } from "@/components/auth/redirect-if-signed-in";
import { NotesSkeleton } from "@/components/common/states";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-wrap">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>

      {/* the brand statement: beside the form on large screens, a slim header on phones */}
      <section className="flex flex-[1_1_480px] flex-col justify-between gap-10 border-ink bg-ground px-5 py-6 sm:px-10 lg:border-r-2 lg:px-14 lg:py-12">
        <Logo />
        <div className="hidden max-w-xl flex-col gap-10 lg:flex">
          <p className="text-6xl leading-[0.92] font-extrabold tracking-[-0.04em] xl:text-7xl">
            Say the thing. Stay hidden until they say yes.
          </p>
          <div aria-hidden="true" className="flex flex-col gap-4">
            <div className="paper flex -rotate-1 items-center gap-3 px-4 py-3 shadow-hard">
              <span className="font-mono text-xs font-bold">FROM</span>
              <RedactionBar label="" className="w-28" />
              <span className="ml-auto font-bold">you were great today</span>
            </div>
            <div className="paper ml-10 flex rotate-1 items-center gap-3 px-4 py-3 shadow-hard">
              <span className="font-mono text-xs font-bold">FROM</span>
              <span className="bg-highlight px-1.5 font-extrabold">Sara K.</span>
              <span className="ml-auto font-bold">unredacted ✓</span>
            </div>
          </div>
        </div>
        <p className="hidden font-mono text-xs font-bold tracking-wider text-ground-soft uppercase lg:block">
          Anonymous notes · revealed only when you accept
        </p>
      </section>

      <main className="flex flex-[1_1_420px] items-start justify-center px-4 pt-2 pb-16 sm:px-8 lg:items-center lg:py-12">
        <div className="w-full max-w-md">
          {/* the forms read ?email= and ?next=, which are only known per request */}
          <Suspense fallback={<NotesSkeleton count={1} />}>{children}</Suspense>
        </div>
      </main>
    </div>
  );
}
