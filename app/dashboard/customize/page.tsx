import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RingCustomizeAR } from "@/components/ring-customize-ar";
import { auth } from "@clerk/nextjs/server";

export const metadata = {
  title: "Try-On Studio · GoldCraft",
  description: "Customize your ring stone and try it on with AR.",
};

export default async function CustomizePage() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  return (
    <main className="h-screen overflow-hidden flex flex-col bg-white text-slate-900">
      <header className="shrink-0 border-b border-slate-200/70 bg-white/95 backdrop-blur-md">
        <div className="flex items-center gap-4 px-4 py-2.5 md:px-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-amber-300 hover:text-amber-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-slate-900 tracking-tight">Try-On Studio</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">
        <RingCustomizeAR />
      </div>
    </main>
  );
}