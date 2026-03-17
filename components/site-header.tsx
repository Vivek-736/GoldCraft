"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LiveGoldPrice } from "@/components/live-gold-price";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export function SiteHeader() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  
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
              href="#faq"
              className="text-sm font-medium hover:text-amber-700 transition-colors scroll-smooth"
            >
              FAQs
            </Link>
          </nav>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white py-4 px-6">
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
          <LiveGoldPrice />

          <div className="hidden md:block h-4 w-px bg-slate-200 mx-2" />

          {isSignedIn ? (
            <Button
              onClick={() => router.push("/dashboard")}
              className="hidden md:flex bg-amber-800 hover:bg-amber-900 text-white rounded-none px-6 cursor-pointer"
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden md:block text-sm font-medium hover:text-amber-700 transition-colors"
              >
                Login
              </Link>
              <Link href="/sign-up">
                <Button className="hidden cursor-pointer md:flex bg-amber-800 hover:bg-amber-900 text-white rounded-none px-6">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
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
            href="#faq"
            className="hover:text-amber-700 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            FAQs
          </Link>

          <div className="h-px bg-slate-100 my-2" />

          {isSignedIn ? (
            <Button
              className="w-full cursor-pointer bg-amber-900 hover:bg-amber-800 text-white"
              onClick={() => {
                setIsMobileMenuOpen(false);
                router.push("/dashboard");
              }}
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hover:text-amber-700 text-center transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href={"/sign-up"}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button className="w-full cursor-pointer bg-amber-900 hover:bg-amber-800 text-white">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  );
}