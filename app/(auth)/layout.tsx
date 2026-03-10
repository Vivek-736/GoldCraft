"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col md:flex-row overflow-hidden selection:bg-stone-100">
      <div
        className="relative hidden md:flex md:w-1/2 lg:w-[55%] h-screen items-center justify-center overflow-hidden bg-stone-50"
        style={{
          clipPath: "polygon(0 0, 100% 0, 85% 100%, 0% 100%)" 
        }}
      >
        <motion.div
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="/auth.jpg"
            alt="Animated Luxury Jewelry"
            fill
            className="object-cover opacity-95"
            priority
          />
          
          <div className="absolute inset-0" />
          <div className="absolute inset-0 mix-blend-multiply" />
        </motion.div>

        <div className="relative z-10 w-full h-full flex flex-col items-center -mt-10 p-12 lg:p-20">
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
