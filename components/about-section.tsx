"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export function AboutSection() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/dashboard");
  };

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
            className="relative h-100 md:h-140 rounded-2xl overflow-hidden shadow-2xl"
          >
            <Image
              src="/gold.jpg"
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
            className="flex flex-col gap-8 justify-center h-full"
          >
            <div className="space-y-4">
              <span className="text-amber-600 font-medium tracking-[0.2em] text-sm uppercase">
                Our Heritage
              </span>
              <h2 className="text-4xl md:text-5xl font-serif text-slate-900 leading-tight">
                Weaving Dreams in <br />
                <span className="text-amber-600">Purest Gold</span>
              </h2>
            </div>

            <p className="text-slate-600 text-lg leading-relaxed border-l-2 border-amber-600 pl-6">
              &quot;True luxury is not just about the gleam of gold, but the
              story it tells.&quot;
            </p>

            <p className="text-slate-500 text-base leading-relaxed">
              At GoldCraft, we blend centuries-old traditions with modern
              artistry. Our artisans don&apos;t just shape metal; they breathe
              life into it. Each piece is a harmonious symphony of integrity,
              passion, and precision, designed to be cherished for generations
              to come.
            </p>

            <div className="grid grid-cols-2 gap-8 text-center md:text-left pt-4">
              <div className="space-y-2">
                <h3 className="text-4xl font-serif text-amber-600">30+</h3>
                <p className="text-slate-500 text-xs uppercase tracking-widest">
                  Years of Artistry
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl font-serif text-amber-600">15k+</h3>
                <p className="text-slate-500 text-xs uppercase tracking-widest">
                  Stories Created
                </p>
              </div>
            </div>
            <div className="pt-6">
              <button
                onClick={handleClick}
                className="px-10 py-4 bg-transparent border border-amber-900 text-amber-900 hover:bg-amber-900 hover:text-white transition-all duration-300 font-medium tracking-wide rounded-none uppercase text-xs"
              >
                Discover Our Story
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}