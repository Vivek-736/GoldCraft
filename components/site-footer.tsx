"use client";

import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-stone-900 bg-black py-12 text-white">
      <div className="container relative z-10 mx-auto flex flex-col items-center justify-center px-4 text-center md:px-6">
        <Link
          href="/"
          className="mb-6 inline-block whitespace-nowrap text-3xl font-serif uppercase tracking-widest text-white"
        >
          GOLD<span className="font-light text-amber-500">CRAFT</span>
        </Link>

        <p className="mb-8 max-w-sm text-sm font-light leading-relaxed text-stone-100">
          The intersection of luxury artistry and intelligent craftsmanship.
        </p>

        <div className="mb-10 flex gap-4">
          <a
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-800 bg-stone-950 text-stone-400 transition-all duration-300 hover:border-amber-500 hover:bg-amber-500 hover:text-black"
          >
            <Facebook className="h-4 w-4" />
          </a>
          <a
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-800 bg-stone-950 text-stone-400 transition-all duration-300 hover:border-amber-500 hover:bg-amber-500 hover:text-black"
          >
            <Twitter className="h-4 w-4" />
          </a>
          <a
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-800 bg-stone-950 text-stone-400 transition-all duration-300 hover:border-amber-500 hover:bg-amber-500 hover:text-black"
          >
            <Instagram className="h-4 w-4" />
          </a>
        </div>

        <div className="w-full max-w-3xl border-t border-stone-900 pt-8">
          <div className="grid gap-3 text-xs font-light text-stone-300 md:grid-cols-2 md:text-left">
            <p>&copy; {new Date().getFullYear()} Gold Craft.</p>
            <p className="md:text-right">All rights reserved.</p>
          </div>

          <p className="mt-6 text-sm font-light tracking-wide text-stone-100 md:text-base">
            Crafted with <span className="text-amber-500">care</span> by{" "}
            <span className="font-medium text-white">Vivek</span>
          </p>
        </div>
      </div>
    </footer>
  );
}