import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  ArrowRight,
  BadgeIndianRupee,
  MessageSquareText,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { isAdminEmail } from "@/lib/admin";

const quickLinkGroups = [
  {
    title: "Create & Explore",
    description:
      "Move from bespoke ideas into visual exploration and gold-focused guidance.",
    items: [
      {
        href: "/dashboard/customize",
        title: "Customize",
        description:
          "Shape bespoke gold pieces with a focused creation workflow.",
        icon: Palette,
      },
      {
        href: "/dashboard/ai-design-studio",
        title: "AI Design Studio",
        description:
          "Explore elegant concept visuals for premium gold jewellery.",
        icon: Sparkles,
      },
      {
        href: "/dashboard/ai-chat",
        title: "AI Chat",
        description:
          "Talk only about gold, craftsmanship, care, and design intent.",
        icon: MessageSquareText,
      },
    ],
  },
  
  {
    title: "Decide & Manage",
    description:
      "Keep investing, profile access, and purchase-ready selections in one calmer zone.",
    items: [
      {
        href: "/dashboard/invest-in-gold",
        title: "Invest in Gold",
        description:
          "Discover a calmer space for gold buying, value, and long-term intent.",
        icon: BadgeIndianRupee,
      },
      {
        href: "/dashboard/profile",
        title: "Profile",
        description:
          "Keep account details and personal preferences close at hand.",
        icon: UserRound,
      },
      {
        href: "/dashboard/cart",
        title: "Cart",
        description:
          "Review selected designs and move toward checkout when ready.",
        icon: ShoppingBag,
      },
    ],
  },
];

export default async function DashboardPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const user = await currentUser();
  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? null;
  const isAdmin = isAdminEmail(primaryEmail);

  return (
    <DashboardShell
      showNav
      eyebrow="GoldCraft Dashboard"
      title="Quiet luxury for your next gold creation."
      description="A refined starting point for custom jewellery, AI-guided design, gold-only conversations, thoughtful gold investment, and the pieces you plan to take forward."
      headerAction={
        <Link
          href={isAdmin ? "/admin" : "/dashboard/profile"}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-colors duration-300 ${
            isAdmin
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          {isAdmin ? "Admin" : "User"}
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {quickLinkGroups.map((group) => (
          <Card
            key={group.title}
            className="border-amber-200"
          >
            <CardContent className="px-4 py-4 md:px-5 md:py-4">
              <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
                {group.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {group.description}
              </p>

              <div className="mt-4 space-y-3">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link key={item.href} href={item.href}>
                      <div className="flex rounded-[1.35rem] border border-amber-100 bg-linear-to-r from-white via-amber-50/35 to-white p-3.5 transition-colors duration-300 hover:border-amber-200 hover:bg-amber-50/50 sm:p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="ml-3 min-w-0 flex-1 sm:ml-4">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-sm font-semibold text-slate-900 sm:text-base md:text-lg">
                              {item.title}
                            </h3>
                            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}