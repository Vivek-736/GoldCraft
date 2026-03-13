import { auth, currentUser } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listAIDesignCartItems } from "@/lib/ai-design-studio";

export default async function CartPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const user = await currentUser();
  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? null;
  const items = primaryEmail ? await listAIDesignCartItems(primaryEmail) : [];

  return (
    <DashboardShell
      eyebrow="Cart"
      title="Saved AI jewelry concepts."
      description="Review the visuals you decided to keep from the design studio."
    >
      {items.length ? (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden rounded-[1.8rem] border-amber-200 bg-white/95 shadow-[0_18px_55px_rgba(217,119,6,0.07)]"
            >
              <CardContent className="p-4">
                <div className="overflow-hidden rounded-[1.3rem] border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.outputUrl}
                    alt="Saved AI jewelry concept"
                    className="h-72 w-full object-cover"
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
                    {item.mode}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    {item.prompt?.trim() || "Saved without a prompt."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-amber-200 bg-white/95 shadow-[0_18px_55px_rgba(217,119,6,0.07)]">
          <CardHeader>
            <CardTitle>No saved AI designs yet</CardTitle>
            <CardDescription>
              Generate a design in the AI Design Studio and save it to cart to see it here.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </DashboardShell>
  );
}