"use client";

import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter
} from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-black text-white py-12 border-t border-stone-900 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center justify-center text-center">

        <Link href="/" className="text-3xl font-serif tracking-widest uppercase text-white whitespace-nowrap inline-block mb-6">
          GOLD<span className="text-amber-500 font-light">CRAFT</span>
        </Link>

        <p className="text-stone-100 font-light text-sm max-w-sm mb-8 leading-relaxed">
          The intersection of luxury artistry and intelligent craftsmanship.
        </p>

        <div className="flex gap-4 mb-10">
          <a href="#" className="w-10 h-10 rounded-full border border-stone-800 bg-stone-950 flex items-center justify-center text-stone-400 hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all duration-300">
            <Facebook className="w-4 h-4" />
          </a>
          <a href="#" className="w-10 h-10 rounded-full border border-stone-800 bg-stone-950 flex items-center justify-center text-stone-400 hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all duration-300">
            <Twitter className="w-4 h-4" />
          </a>
          <a href="#" className="w-10 h-10 rounded-full border border-stone-800 bg-stone-950 flex items-center justify-center text-stone-400 hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all duration-300">
            <Instagram className="w-4 h-4" />
          </a>
        </div>

        <div className="pt-8 border-t border-stone-900 w-full max-w-2xl flex flex-col items-center gap-4 text-xs font-light text-stone-200">
          <p className="tracking-wide text-stone-200">
            Crafted with <span className="text-amber-500">💖</span> and <span className="text-amber-500">☕</span> by <span className="font-medium text-white">Vivek</span>
          </p>
          <p>&copy; {new Date().getFullYear()} Gold Craft. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}