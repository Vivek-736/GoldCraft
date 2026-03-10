import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";

export default async function AIChatPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  return (
    <DashboardShell
      eyebrow="AI Chat"
      title="A gold-only conversation space."
      description="This page is reserved for tightly scoped chat about gold, jewellery craftsmanship, style decisions, care, and collection guidance."
    >
      <Card className="border-amber-200 bg-white/95 shadow-[0_18px_55px_rgba(217,119,6,0.07)]">
        <CardContent className="p-6 md:p-8">
          <p className="max-w-2xl text-slate-600 leading-7">
            The assistant here should stay disciplined, elegant, and on-topic. If the conversation leaves the world of gold, it should gently refuse and return the user to relevant help.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}