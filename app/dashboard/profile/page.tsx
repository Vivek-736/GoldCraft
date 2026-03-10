import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Mail,
  Shield,
  UserRound,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProfilePhoneCard } from "@/components/profile-phone-card";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";

const formatDate = (value?: number | Date | null) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
};

export default async function ProfilePage() {
  const { userId, sessionId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const user = await currentUser();

  if (!user) {
    return redirectToSignIn();
  }

  const primaryEmail = user.primaryEmailAddress?.emailAddress ?? "Not available";
  const externalAccounts =
    user.externalAccounts?.map((account) => account.provider) ?? [];

  const appUser =
    primaryEmail === "Not available"
      ? []
      : await db.select().from(usersTable).where(eq(usersTable.email, primaryEmail));

  const savedPhoneNumber = appUser[0]?.phoneNumber ?? null;

  const profileFacts = [
    { label: "Full name", value: user.fullName ?? "Not available", icon: UserRound },
    { label: "Username", value: user.username ?? "Not available", icon: BadgeCheck },
    { label: "Primary email", value: primaryEmail, icon: Mail },
    { label: "Last sign in", value: formatDate(user.lastSignInAt), icon: Shield },
  ];

  return (
    <DashboardShell showHeaderCard={false}>
      <div className="mb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-900 shadow-sm transition-colors duration-300 hover:bg-amber-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-4">
          <Card className="border-amber-200">
            <CardContent className="p-5 md:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {user.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.imageUrl}
                      alt={user.fullName ?? "User avatar"}
                      className="h-20 w-20 rounded-full border border-amber-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-800">
                      <UserRound className="h-8 w-8" />
                    </div>
                  )}

                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-amber-700">
                      Clerk snapshot
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                      {user.fullName ?? "GoldCraft User"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">{primaryEmail}</p>
                  </div>
                </div>

                <div className="rounded-full border border-amber-200 bg-white p-1.5 shadow-sm">
                  <UserButton />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {profileFacts.map((fact) => {
                  const Icon = fact.icon;

                  return (
                    <div
                      key={fact.label}
                      className="rounded-[1.35rem] border border-amber-100 bg-linear-to-b from-white to-amber-50/45 p-4"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="mt-3 text-xs uppercase tracking-[0.22em] text-amber-700">
                        {fact.label}
                      </p>
                      <p className="mt-1 wrap-break-word text-sm font-medium text-slate-900">
                        {fact.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <ProfilePhoneCard initialPhoneNumber={savedPhoneNumber} />
        </div>

        <div className="grid gap-4">
          <Card className="border-amber-200">
            <CardContent className="p-5 md:p-6">
              <h3 className="text-xl font-semibold text-slate-900">Account details</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-4xl border border-amber-100 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-amber-700">User ID</p>
                  <p className="mt-2 break-all text-sm text-slate-900">{user.id}</p>
                </div>
                <div className="rounded-4xl border border-amber-100 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-amber-700">Session ID</p>
                  <p className="mt-2 break-all text-sm text-slate-900">{sessionId ?? "Not available"}</p>
                </div>
                <div className="rounded-4xl border border-amber-100 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-amber-700">External providers</p>
                  <p className="mt-2 text-sm text-slate-900">{externalAccounts.length ? externalAccounts.join(", ") : "Not connected yet"}</p>
                </div>
                <div className="rounded-4xl border border-amber-100 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-amber-700">Joined</p>
                  <p className="mt-2 text-sm text-slate-900">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}