"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Award, ShieldCheck, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShopSection() {
  const handleAddToCart = () => {
    toast.success("Added to cart", {
      description: "The Royal Band has been added to your collection.",
    });
  };

  return (
    <section
      id="shop"
      className="relative w-full py-24 bg-slate-50 overflow-hidden"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-amber-600 font-medium tracking-[0.2em] text-sm uppercase mb-4">
            Exclusive Collection
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-slate-900">
            The Royal <span className="text-amber-600">Band</span>
          </h2>
          <p className="text-slate-500 mt-4 max-w-xl">
            A symbol of eternal luxury. Meticulously crafting perfection in
            every curve, reflecting the true essence of royalty.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-xl overflow-hidden min-h-125 border border-slate-100 p-12 flex flex-col justify-center items-center relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-amber-50/50 via-transparent to-transparent opacity-60 pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="text-center space-y-8 max-w-2xl relative z-10"
            >
              <div className="inline-block p-4 rounded-full bg-amber-50 mb-4">
                <Gem className="w-12 h-12 text-amber-600" />
              </div>

              <h3 className="text-3xl md:text-5xl font-serif text-slate-900 leading-tight">
                &quot;More than jewelry. It&apos;s an heirloom.&quot;
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100 mt-8">
                <div className="flex flex-col items-center gap-3">
                  <Award className="w-6 h-6 text-amber-600" />
                  <span className="text-sm font-medium text-slate-900 uppercase tracking-widest">
                    Master Crafted
                  </span>
                  <p className="text-xs text-slate-500">
                    Hand-finished by artisans with decades of experience
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-amber-600" />
                  <span className="text-sm font-medium text-slate-900 uppercase tracking-widest">
                    Lifetime Warranty
                  </span>
                  <p className="text-xs text-slate-500">
                    Guaranteed quality that lasts for generations
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Gem className="w-6 h-6 text-amber-600" />
                  <span className="text-sm font-medium text-slate-900 uppercase tracking-widest">
                    Purest Gold
                  </span>
                  <p className="text-xs text-slate-500">
                    Certified 24K gold sourced responsibly
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
              <h3 className="text-3xl font-serif text-slate-900 mb-4">
                Golden Legacy
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Forged from the finest 24K gold, this masterpiece combines
                contemporary design with timeless elegance. Each piece is a
                testament to our commitment to absolute perfection.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                    Purity
                  </span>
                  <span className="font-serif text-slate-900">24 Karat</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                    Weight
                  </span>
                  <span className="font-serif text-slate-900">12 Grams</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                    Warranty
                  </span>
                  <span className="font-serif text-slate-900">Lifetime</span>
                </div>
              </div>

              <motion.div>
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-amber-900 hover:bg-amber-800 text-white py-8 rounded-2xl text-lg font-medium flex items-center justify-center gap-3 shadow-xl shadow-amber-900/20 cursor-pointer"
                >
                  <ShoppingCart className="w-6 h-6" />
                  Purchase Now — ₹1,22,499
                </Button>
              </motion.div>
            </div>
            <p className="text-slate-400 text-xs text-center flex items-center justify-center gap-1">
              Secured Delivery • Hallmarked Certified
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}