import { auth } from "@clerk/nextjs/server";

import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";

export default async function InvestInGoldPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  return (
    <DashboardShell
      eyebrow="Invest in Gold"
      title="A thoughtful place to explore gold as an asset."
      description="This page is for users who want a clean overview of gold buying, confidence, long-term value, and investment-minded decisions."
    >
      <Card className="border-amber-200 bg-white/95 shadow-[0_18px_55px_rgba(217,119,6,0.07)]">
        <CardContent className="p-6 md:p-8">
          <p className="max-w-2xl text-slate-600 leading-7">
            Keep this section informative, calm, and premium. It should help the
            user understand why gold matters, what to look for, and how to move
            with clarity rather than noise.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
