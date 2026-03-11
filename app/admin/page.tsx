import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { isAdminEmail } from "@/lib/admin";

export default async function AdminPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  if (!isAdminEmail(email)) {
    notFound();
  }

  return (
    <DashboardShell
      eyebrow="Admin"
      title="Administrative access for GoldCraft operators."
      description="This area is reserved for approved admin accounts only."
    >
      <Card className="border-amber-200 bg-white/95 shadow-[0_18px_55px_rgba(217,119,6,0.07)]">
        <CardContent className="p-5 md:p-6">
          <p className="text-sm leading-6 text-slate-600">
            You are signed in with an approved admin account and can continue building the admin experience from here.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}