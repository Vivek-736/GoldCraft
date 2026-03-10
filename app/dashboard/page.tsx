import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  ArrowRight,
  BadgeIndianRupee,
  MessageSquareText,
  Palette,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";

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

  return (
    <DashboardShell
      eyebrow="GoldCraft Dashboard"
      title="Quiet luxury for your next gold creation."
      description="A refined starting point for custom jewellery, AI-guided design, gold-only conversations, thoughtful gold investment, and the pieces you plan to take forward."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {quickLinkGroups.map((group) => (
          <Card
            key={group.title}
            className="border-amber-200 bg-white/95 shadow-[0_18px_55px_rgba(217,119,6,0.07)]"
          >
            <CardContent className="px-5 py-4 md:px-6 md:py-4">
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">
                {group.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
                {group.description}
              </p>

              <div className="mt-5 space-y-3">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link key={item.href} href={item.href}>
                      <div className="flex rounded-[1.5rem] border border-amber-100 bg-linear-to-r from-white via-amber-50/35 to-white p-4 transition-colors duration-300 hover:border-amber-200 hover:bg-amber-50/50">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-base font-semibold text-slate-900 md:text-lg">
                              {item.title}
                            </h3>
                            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
                          </div>
                          <p className="mt-1 text-sm leading-5 text-slate-600">
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