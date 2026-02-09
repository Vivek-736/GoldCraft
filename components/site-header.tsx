"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 py-4 bg-white/80 backdrop-blur-md border-b border-amber-100/20">
        <div className="flex items-center gap-4 md:gap-8">
          <button
            className="md:hidden p-2 -ml-2 text-slate-700 hover:text-amber-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-medium hover:text-amber-700 transition-colors"
            >
              Home
            </Link>

            <div className="group relative">
              <button className="text-sm font-medium text-slate-900 hover:text-amber-700 transition-colors flex items-center gap-1 py-2">
                Products
                <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
              </button>

              <div className="absolute top-full left-0 pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 -translate-y-2 group-hover:translate-y-0 z-50">
                <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-2 flex flex-col relative overflow-hidden">
                  <Link
                    href="#shop"
                    className="block px-4 py-2 text-sm text-slate-600 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    Rings & Solitaires
                  </Link>
                  <Link
                    href="#shop"
                    className="block px-4 py-2 text-sm text-slate-600 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    Necklaces & Pendants
                  </Link>
                  <Link
                    href="#shop"
                    className="block px-4 py-2 text-sm text-slate-600 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    Bracelets & Bangles
                  </Link>
                  <Link
                    href="#shop"
                    className="block px-4 py-2 text-sm text-slate-600 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    Earrings
                  </Link>
                  <Link
                    href="#shop"
                    className="block px-4 py-2 text-sm text-slate-600 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    Nose Rings
                  </Link>
                  <Link
                    href="#shop"
                    className="block px-4 py-2 text-sm text-slate-600 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    Custom Designs
                  </Link>
                </div>
              </div>
            </div>
            <Link
              href="#discover"
              className="text-sm font-medium hover:text-amber-700 transition-colors scroll-smooth"
            >
              Discover
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium hover:text-amber-700 transition-colors scroll-smooth"
            >
              About
            </Link>
            <Link
              href="#shop"
              className="text-sm font-medium hover:text-amber-700 transition-colors scroll-smooth"
            >
              Shop
            </Link>
          </nav>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white">
          <Link href="/">
            <Image
              src="/AppName.png"
              alt="GoldCraft"
              width={150}
              height={20}
              className="w-auto"
            />
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 hover:bg-amber-50 rounded-full transition-colors text-slate-700 hover:text-amber-900">
                  <ShoppingBag className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cart</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="hidden md:block h-4 w-px bg-slate-200 mx-2" />

          <Link
            href="/login"
            className="hidden md:block text-sm font-medium hover:text-amber-700 transition-colors"
          >
            Login
          </Link>
          <Button className="hidden cursor-pointer md:flex bg-amber-600 hover:bg-amber-800 text-white rounded-none px-6">
            Sign Up
          </Button>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-white pt-24 px-6 transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <nav className="flex flex-col gap-6 text-lg font-medium">
          <Link
            href="/"
            className="hover:text-amber-700 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </Link>
          <div className="py-2 border-b border-gray-100">
            <p className="mb-4 text-amber-900 font-bold">Products</p>
            <div className="grid grid-cols-2 gap-4 text-base pl-2">
              <Link
                href="#shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-600"
              >
                Rings
              </Link>
              <Link
                href="#shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-600"
              >
                Necklaces
              </Link>
              <Link
                href="#shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-600"
              >
                Bracelets
              </Link>
              <Link
                href="#shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-600"
              >
                Earrings
              </Link>
            </div>
          </div>
          <Link
            href="#discover"
            className="hover:text-amber-700 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Discover
          </Link>
          <Link
            href="#about"
            className="hover:text-amber-700 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            About
          </Link>
          <Link
            href="#shop"
            className="hover:text-amber-700 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Shop
          </Link>

          <div className="h-px bg-slate-100 my-2" />

          <Link
            href="/login"
            className="hover:text-amber-700 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Login
          </Link>

          <Button className="w-full cursor-pointer bg-amber-900 hover:bg-amber-800 text-white">
            Sign Up
          </Button>
        </nav>
      </div>
    </>
  );
}