import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Diamond, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fcfcfc]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(251,191,36,0.24),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(245,158,11,0.18),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(148,163,184,0.14),transparent_42%)]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-136 w-136 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/55 blur-3xl" />

      <main className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-18 text-center">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">
          GoldCraft
        </p>

        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute h-28 w-28 rounded-full bg-amber-200/55 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-amber-900 shadow-[0_14px_40px_rgba(146,64,14,0.18)]">
            <Diamond className="h-9 w-9 stroke-[1.6]" />
          </div>
        </div>

        <h1 className="pointer-events-none absolute top-1/2 -z-10 -translate-y-[62%] select-none text-[8.5rem] leading-none font-serif text-amber-900/8 md:text-[12rem]">
          404
        </h1>

        <h2 className="max-w-3xl text-3xl font-serif tracking-wide text-slate-950 md:text-5xl">
          Lost in the Vault of Designs
        </h2>

        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
          The page you&apos;re looking for has slipped out of our collection.
          Continue to the homepage or jump back into your design studio.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            className="h-11 rounded-full bg-slate-900 px-6 text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="pr-1.5">Back to Home</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-transparent bg-white/80 px-6 text-amber-900 shadow-sm hover:bg-white"
          >
            <Link href="/dashboard/ai-design-studio">
              <Sparkles className="h-4 w-4" />
              Open Design Studio
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}