import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StudioChoiceCard } from "@/components/ai-design-studio-workspace";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";

export default async function AIDesignStudioPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  return (
    <DashboardShell showHeaderCard={false}>
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-350 flex-col justify-center overflow-x-hidden px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-slate-200 bg-white/90 px-4 text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        <section className="mt-8 flex flex-col items-center text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-700">
            AI DESIGN STUDIO
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Design Gold
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 md:text-base">
            Choose how you want to begin.
          </p>
        </section>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <StudioChoiceCard
            href="/ai-design-studio/design"
            title="Design It Your Way"
            description="Describe the jewelry piece in your own words and shape a refined gold concept from prompts."
            icon="design"
          />
          <StudioChoiceCard
            href="/ai-design-studio/upload"
            title="Upload Your Sketch"
            description="Start from a hand sketch, reference image, or concept board and guide the result with a few notes."
            icon="upload"
          />
        </div>
      </div>
    </DashboardShell>
  );
}