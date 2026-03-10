import { auth } from "@clerk/nextjs/server";

import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";

export default async function CustomizePage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  return (
    <DashboardShell
      eyebrow="Customize"
      title="Design gold pieces with your own signature."
      description="This page is for shaping custom jewellery ideas, refining finishes, and preparing premium requests before they become something tangible."
    >
      <Card className="border-amber-200 bg-white/95 shadow-[0_18px_55px_rgba(217,119,6,0.07)]">
        <CardContent className="p-6 md:p-8">
          <p className="max-w-2xl text-slate-600 leading-7">
            A clean customization workspace lives here. It should help the user focus on gold purity, silhouette, stones, engravings, and the details that make a design feel personal.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
