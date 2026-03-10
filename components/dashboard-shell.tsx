import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

const navItems = [
  { href: "/dashboard/customize", label: "Customize" },
  { href: "/dashboard/ai-design-studio", label: "AI Design Studio" },
  { href: "/dashboard/ai-chat", label: "AI Chat" },
  { href: "/dashboard/invest-in-gold", label: "Invest in Gold" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/cart", label: "Cart" },
];

type DashboardShellProps = {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
};

export function DashboardShell({
  children,
  eyebrow = "GoldCraft Dashboard",
  title,
  description,
}: DashboardShellProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fcfcfc] text-slate-900">
      <div className="fixed inset-x-0 top-0 z-50 border-b border-amber-200/60 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="overflow-hidden rounded-full border border-amber-200 bg-white p-1.5 shadow-sm">
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
          <nav className="hidden items-center gap-2 rounded-full border border-amber-200/80 bg-white/85 p-2 shadow-[0_12px_40px_rgba(15,23,42,0.06)] md:flex">
            {navItems.map((item) => {

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-300 hover:bg-amber-50 hover:text-amber-800"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="rounded-full border border-amber-200 bg-white p-1.5 shadow-sm">
            <UserButton />
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pb-4 md:hidden">
          {navItems.map((item) => {

            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
      
      <section className="relative px-4 pb-10 pt-32 md:px-6 md:pb-12 md:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_35%),radial-gradient(circle_at_right,rgba(180,83,9,0.1),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="w-full rounded-[2rem] border border-amber-200/70 bg-white/90 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.07)] md:p-6">
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
          <div className="mt-5">{children}</div>
        </div>
      </section>
    </main>
  );
}