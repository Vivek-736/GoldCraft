"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen overflow-hidden bg-[#f3eee4] text-slate-950 selection:bg-amber-100">
      <div className="mx-auto h-full max-w-screen-2xl p-3 md:p-4">
        <div className="grid h-full w-full overflow-hidden rounded-[1.85rem] border border-stone-200/80 bg-[#fbfaf6] shadow-[0_26px_80px_rgba(15,23,42,0.08)] lg:grid-cols-[1fr_0.92fr]">
          <div className="hidden min-h-0 border-r border-stone-200/80 bg-[#f7f3eb] lg:flex lg:flex-col lg:p-6 xl:p-7">
            <Link href="/" className="inline-flex items-center gap-3 self-start">
              <Image
                src="/favicon.png"
                alt="GoldCraft"
                width={38}
                height={38}
                className="rounded-full border border-stone-200 bg-white"
              />

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-700">
                  GoldCraft
                </p>
                <p className="text-sm text-slate-600">Secure access</p>
              </div>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex min-h-0 flex-1 flex-col gap-5 pt-6"
            >
              <div className="max-w-md space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">
                  Minimal and elegant
                </p>
                <h1 className="font-serif text-[3.15rem] leading-[0.98] tracking-tight text-slate-950 xl:text-[3.5rem]">
                  Enter GoldCraft.
                </h1>
                <p className="text-[15px] leading-7 text-slate-600">
                  Sign in to continue to your dashboard and customization workspace.
                </p>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden rounded-[1.7rem] border border-stone-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                <div className="relative h-full w-full">
                  <Image
                    src="/authentication.jpg"
                    alt="GoldCraft authentication"
                    fill
                    priority
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 xl:p-5">
                    <div className="rounded-[1.15rem] border border-white/15 bg-black/48 px-4 py-3 text-white backdrop-blur-sm">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/70">
                        GoldCraft Access
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/90">
                        Clean entry into your premium workspace.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex min-h-0 items-center justify-center p-4 md:p-5 lg:p-6 xl:p-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.04 }}
              className="w-full max-w-md"
            >
              <Link href="/" className="mb-5 inline-flex items-center gap-3 lg:hidden">
                <Image
                  src="/favicon.png"
                  alt="GoldCraft"
                  width={34}
                  height={34}
                  className="rounded-full border border-stone-200 bg-white"
                />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-700">
                    GoldCraft
                  </p>
                  <p className="text-sm text-slate-600">Secure access</p>
                </div>
              </Link>

              <div className="rounded-[1.7rem] border border-stone-200 bg-white px-5 py-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)] md:px-7 md:py-6">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
