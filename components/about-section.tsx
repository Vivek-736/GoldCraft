"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function AboutSection() {
  return (
    <section
      id="about"
      className="relative w-full py-24 mt-10 bg-white overflow-hidden"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative h-100 md:h-150 rounded-2xl overflow-hidden shadow-2xl"
          >
            <Image
              src="/discover.jpg"
              alt="Our Craftsmanship"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-amber-900/10 mix-blend-multiply" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="flex flex-col gap-8"
          >
            <div className="space-y-4">
              <span className="text-amber-600 font-medium tracking-[0.2em] text-sm uppercase">
                Our Legacy
              </span>
              <h2 className="text-4xl md:text-5xl font-serif text-slate-900 leading-tight">
                Crafting Stories in 
                <br />
                <span className="text-amber-600">Pure Gold</span>
              </h2>
            </div>

            <p className="text-slate-600 text-lg leading-relaxed">
              Founded on the principles of integrity and artistry, GoldCraft has
              been defining luxury for generations. We don&apos;t just sell
              jewellery; we create masterpieces that celebrate life&apos;s most
              precious moments.
            </p>

            <div className="grid grid-cols-2 gap-8 text-center md:text-left">
              <div className="space-y-2">
                <h3 className="text-3xl font-serif text-amber-600">25+</h3>
                <p className="text-slate-500 text-sm uppercase tracking-wider">
                  Years of Excellence
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-serif text-amber-600">10k+</h3>
                <p className="text-slate-500 text-sm uppercase tracking-wider">
                  Happy Clients
                </p>
              </div>
            </div>

            <motion.div
              className="pt-4"
            >
              <button className="px-8 py-3 border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white transition-all font-medium tracking-wide">
                Learn More About Us
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}