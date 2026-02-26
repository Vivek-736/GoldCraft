"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col md:flex-row overflow-hidden selection:bg-stone-100">
      <div className="relative hidden md:flex md:w-1/2 lg:w-[55%] h-screen items-center justify-center overflow-hidden bg-stone-50">
        <motion.div
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop"
            alt="Luxury Silk Texture"
            fill
            className="object-cover opacity-90"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-r from-white/40 via-transparent to-white/10" />
          <div className="absolute inset-0 bg-stone-900/10 mix-blend-multiply" />
        </motion.div>

        <div className="relative z-10 w-full h-full flex flex-col justify-between p-12 lg:p-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <Link href="/" className="inline-block">
              <Image
                src="/AppName.png"
                alt="GoldCraft"
                width={160}
                height={40}
                className="opacity-95 bg-white p-2 px-6 rounded-lg"
              />
            </Link>
          </motion.div>

          <div className="space-y-8 max-w-lg">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="text-4xl lg:text-6xl font-serif text-stone-900 leading-[1.1]"
            >
              Timeless Elegance, <br />
              <span className="text-stone-500">Redefined.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 1 }}
              className="text-stone-600 text-lg font-light tracking-wide"
            >
              Enter the world of bespoke craftsmanship. Exclusive access to our curated design vault awaits.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="flex items-center gap-6 text-xs tracking-widest text-white uppercase font-medium"
          >
            <span>Est. 2026</span>
            <div className="w-12 h-px bg-stone-300" />
            <span>Vizag • Guntur • Vijayawada</span>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-white relative">
        <Link
          href="/"
          className="md:hidden mb-8 absolute top-8 left-8"
        >
          <Image
            src="/AppName.png"
            alt="GoldCraft"
            width={120}
            height={30}
          />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="relative z-10 w-full max-w-[400px]"
        >
          <div className="auth-inner-wrapper bg-white">
            {children}
          </div>

          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-stone-400 text-[10px] uppercase tracking-[0.2em] font-medium text-center">
              Secure Authentication
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
