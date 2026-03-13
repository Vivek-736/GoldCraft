import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  BadgeIndianRupee,
  MessageSquareText,
  Palette,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";

const navItems = [
  { 
    href: "/dashboard/customize", 
    label: "Customize", 
    icon: Palette 
  },
  {
    href: "/dashboard/ai-design-studio",
    label: "AI Design Studio",
    icon: Sparkles,
  },
  { 
    href: "/dashboard/ai-chat", 
    label: "AI Chat", 
    icon: MessageSquareText 
  },
  {
    href: "/dashboard/invest-in-gold",
    label: "Invest in Gold",
    icon: BadgeIndianRupee,
  },
  { 
    href: "/dashboard/profile", 
    label: "Profile", 
    icon: UserRound 
  },
  { 
    href: "/dashboard/cart", 
    label: "Cart", 
    icon: ShoppingBag 
  },
];

type DashboardShellProps = {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
  showNav?: boolean;
  showHeaderCard?: boolean;
  headerAction?: React.ReactNode;
};

export function DashboardShell({
  children,
  eyebrow = "GoldCraft Dashboard",
  title,
  description,
  showNav = false,
  showHeaderCard = true,
  headerAction,
}: DashboardShellProps) {
  const topSpacing = showNav ? "pt-32 md:pt-36" : "pt-10 md:pt-12";

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      {showNav ? (
        <div className="fixed inset-x-0 top-0 z-50 border-b border-white/30">
          <div className="mx-auto flex max-w-7xl bg-white border-b-2 border-slate-300 z-100 items-center justify-between px-4 py-4 md:px-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="overflow-hidden rounded-full border border-white/50 bg-white/60 p-1.5 shadow-sm">
                <Image
                  src="/favicon.png"
                  alt="GoldCraft"
                  width={34}
                  height={34}
                  className="rounded-full"
                />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-amber-700">
                  GoldCraft
                </p>
                <p className="text-sm font-semibold text-slate-900 md:text-base">
                  Dashboard
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 rounded-full border border-white/50 p-2 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-300 hover:bg-amber-50/80 hover:text-amber-800"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="rounded-full border border-white/50 bg-white/60 p-1.5 shadow-sm">
              <UserButton />
            </div>
          </div>
        </div>
      ) : null}

      <section className={`relative px-4 pb-10 ${topSpacing} md:px-6 md:pb-12`}>
        <div className="relative mx-auto max-w-7xl">
          {showHeaderCard ? (
            <div className="w-full rounded-[2rem] border border-amber-200/70 bg-white/90 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.07)] md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.32em] text-amber-700">
                    {eyebrow}
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-900 md:text-5xl">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                    {description}
                  </p>
                </div>
                {headerAction ? (
                  <div className="shrink-0 self-start">{headerAction}</div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className={showHeaderCard ? "mt-5" : ""}>{children}</div>
        </div>
      </section>
    </main>
  );
}