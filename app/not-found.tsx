import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Diamond } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-col items-center text-center max-w-lg">
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-amber-100 blur-xl rounded-full opacity-50" />
            <Diamond className="w-16 h-16 text-amber-900 relative z-10 stroke-1" />
          </div>

          <h1 className="text-9xl font-serif text-amber-900/10 absolute select-none pointer-events-none -z-10 translate-y-8">
            404
          </h1>

          <h2 className="text-3xl md:text-4xl font-serif text-slate-900 mb-6 tracking-wide">
            This Page is a Hidden Gem
          </h2>

          <p className="text-slate-500 mb-10 leading-relaxed max-w-md">
            We&apos;ve looked through all our collections but couldn&apos;t find
            the page you requested. Why not browse our latest custom pieces
            instead?
          </p>

          <Link href="/">
            <Button className="bg-amber-900 hover:bg-amber-800 text-white min-w-50 h-14 rounded-none uppercase tracking-widest text-xs font-bold shadow-lg shadow-amber-900/20 transition-all cursor-pointer">
              Back to Homepage
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}