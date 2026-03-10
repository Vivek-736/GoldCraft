import { auth } from "@clerk/nextjs/server";

import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";

export default async function AIDesignStudioPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  return (
    <DashboardShell
      eyebrow="AI Design Studio"
      title="Concept imagery for elevated gold collections."
      description="This page is meant for generating polished visual directions, exploring aesthetics, and saving the most promising gold design concepts."
    >
      <Card className="border-amber-200 bg-white/95 shadow-[0_18px_55px_rgba(217,119,6,0.07)]">
        <CardContent className="p-6 md:p-8">
          <p className="max-w-2xl text-slate-600 leading-7">
            Keep this space image-first, elegant, and selective. It should feel like a concept studio for gold jewellery rather than a generic generator.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
