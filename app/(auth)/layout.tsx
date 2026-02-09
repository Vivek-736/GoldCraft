"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full bg-[#fdfcfb] flex flex-col md:flex-row overflow-hidden selection:bg-amber-100">
      <div className="relative hidden md:flex md:w-1/2 lg:w-3/5 h-screen items-center justify-center overflow-hidden bg-[#faf7f2]">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop"
            alt="Ivory Silk Texture"
            fill
            className="object-cover opacity-80"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-r from-white via-transparent to-white/40" />
          <div className="absolute inset-0 bg-linear-to-b from-white/20 via-transparent to-amber-50/30" />
        </motion.div>

        <div className="relative z-10 w-full h-full flex flex-col justify-between p-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Image
              src="/AppName.png"
              alt="GoldCraft"
              width={180}
              height={40}
              className="opacity-90 rounded-xl border-4 border-amber-600"
            />
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "80px" }}
              transition={{ delay: 1, duration: 1 }}
              className="h-1 bg-amber-600"
            />
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="text-5xl lg:text-7xl font-serif text-slate-900 leading-tight"
            >
              The Alchemy of <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-500 via-amber-700 to-amber-900 animate-gradient-x">
                Precision
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="text-amber-800/70 text-lg max-w-sm font-light tracking-wide uppercase"
            >
              Exclusive Access to the Design Vault
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="flex items-center gap-4 text-xs tracking-widest text-slate-400 uppercase font-medium"
          >
            <span>2026</span>
            <div className="w-12 h-px bg-amber-200" />
            <span>Vizag • Guntur • Vijayawada</span>
          </motion.div>
        </div>

        <motion.div
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-0 left-0 w-1/2 h-full bg-linear-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] pointer-events-none"
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-white relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-amber-100/20 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="relative group">
            <div className="absolute -inset-px bg-linear-to-r from-amber-200/50 via-transparent to-amber-200/50 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition duration-1000" />

            <div className="relative bg-[#fdfcfb] border border-amber-100/50 rounded-2xl p-1 shadow-[0_20px_50px_rgba(234,179,8,0.05)]">
              <div className="auth-inner-wrapper rounded-xl overflow-hidden shadow-inner">
                {children}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-200" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-200" />
            </div>
            <p className="text-slate-400 text-[10px] uppercase tracking-[0.3em] font-semibold">
              Encrypted Luxury Interface
            </p>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes gradient-x {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
