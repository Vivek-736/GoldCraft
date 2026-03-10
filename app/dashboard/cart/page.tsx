import { auth } from "@clerk/nextjs/server";

import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";

export default async function CartPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  return (
    <DashboardShell
      eyebrow="Cart"
      title="A calm place to review what is worth keeping."
      description="This page is for selected designs, thoughtful review, and the final choices a user is ready to carry forward."
    >
      <Card className="border-amber-200 bg-white/95 shadow-[0_18px_55px_rgba(217,119,6,0.07)]">
        <CardContent className="p-6 md:p-8">
          <p className="max-w-2xl text-slate-600 leading-7">
            The cart should feel curated, not crowded. Let it hold the designs that survived the exploration phase and are ready for the next decision.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
