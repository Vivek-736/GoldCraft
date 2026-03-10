import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProfilePage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  return (
    <DashboardShell
      eyebrow="Profile"
      title="Your GoldCraft account, kept simple."
      description="This page is for identity, preferences, and account actions without interrupting the calm visual rhythm of the dashboard."
    >
      <Card className="border-amber-200 bg-white/95 shadow-[0_18px_55px_rgba(217,119,6,0.07)]">
        <CardContent className="flex items-center justify-between gap-4 p-6 md:p-8">
          <div>
            <p className="text-lg font-semibold text-slate-900">Manage your account</p>
            <p className="mt-2 max-w-xl text-slate-600 leading-7">
              Keep profile access close, clean, and familiar with Clerk handling the account controls.
            </p>
          </div>
          <div className="rounded-full border border-amber-200 bg-white p-1.5 shadow-sm">
            <UserButton />
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
