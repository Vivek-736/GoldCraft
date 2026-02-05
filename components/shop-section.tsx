"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Heart } from "lucide-react";

// Mock data for shop items
const products = [
  {
    id: 1,
    name: "Ethereal Diamond Ring",
    price: "$1,290",
    image: "https://images.unsplash.com/photo-1605100804763-ebea2406a95f?q=80&w=1974&auto=format&fit=crop",
    category: "Rings",
  },
  {
    id: 2,
    name: "Gold Leaf Pendant",
    price: "$850",
    image: "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=1974&auto=format&fit=crop",
    category: "Necklaces",
  },
  {
    id: 3,
    name: "Emerald Studs",
    price: "$2,100",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1974&auto=format&fit=crop",
    category: "Earrings",
  },
  {
    id: 4,
    name: "Sapphire Bracelet",
    price: "$3,400",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=2070&auto=format&fit=crop",
    category: "Bracelets",
  },
];

export function ShopSection() {
  return (
    <section id="shop" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif">
               Curated Collections
            </h2>
            <p className="text-slate-600 text-lg">
                Timeless pieces designed to be cherished forever. Browse our latest arrivals and signature collections.
            </p>
          </motion.div>
          <motion.div
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
          >
              <Button variant="outline" className="border-slate-200 hover:border-emerald-900 hover:text-emerald-900 transition-colors rounded-none px-6">
                  View All Products <ArrowUpRight className="ml-2 w-4 h-4" />
              </Button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product, index) => (
                <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group cursor-pointer"
                >
                    <div className="relative aspect-square overflow-hidden bg-stone-100 rounded-xl mb-4">
                        <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-4 right-4 z-10 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                             <button className="bg-white p-2 rounded-full shadow-lg hover:text-red-500 transition-colors">
                                <Heart className="w-5 h-5" />
                             </button>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-emerald-800 font-medium mb-1 uppercase tracking-wider">{product.category}</p>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">{product.name}</h3>
                        <p className="text-slate-600 mt-1">{product.price}</p>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
}
