"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { PenTool, Box, Gem } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const features = [
  {
    icon: PenTool,
    title: "Custom Design",
    description: "Sketch your dream jewelry or work with our designers to create a unique piece that tells your story.",
  },
  {
    icon: Box,
    title: "3D Modeling",
    description: "Visualize your creation in stunning detail with our advanced 3D modeling technology before crafting.",
  },
  {
    icon: Gem,
    title: "Expert Craftsmanship",
    description: "Our master jewelers bring your vision to life using the finest metals and ethically sourced gemstones.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function DiscoverSection() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLImageElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerRef.current,
                start: "top top",
                end: "+=1500", 
                scrub: 1,
                pin: true,
            }
        });

        // Effect: Ring scales up massively to "let image pass through" (camera goes through ring)
        tl.to(ringRef.current, {
            scale: 50,
            duration: 5,
            ease: "power2.inOut",
        }, 0);

        // Ring fades out as it surrounds "us"
        tl.to(ringRef.current, {
            opacity: 0,
            duration: 1, 
        }, 3.5);

        // Background image scales up from the "void" of the ring
        tl.fromTo(galleryRef.current,
            { scale: 0.2, opacity: 0 },
            { scale: 1, opacity: 1, duration: 4, ease: "power2.out" },
            0.5
        );

    }, triggerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="discover" className="bg-stone-50 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif tracking-tight">
            Discover the Art of Personalization
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            At Gold Craft, we blend traditional artistry with modern technology to create jewelry that is uniquely yours. Explore our process from concept to creation.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 text-emerald-900">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

       {/* Animated Scroll Section */}
       <div ref={triggerRef} className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-stone-50">
            {/* The Hidden/Appearing Image */}
             <div ref={galleryRef} className="absolute inset-0 flex items-center justify-center z-0 p-4 md:p-12">
                 <div className="relative w-full h-full max-w-7xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl">
                    <img 
                        src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=2069&auto=format&fit=crop" 
                        alt="Jewelry Creation Process" 
                        className="w-full h-full object-cover"
                    />
                     <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-8 md:p-12 text-center md:text-left">
                        <h3 className="text-2xl md:text-4xl font-bold text-white font-serif mb-2">Crafted for You</h3>
                        <p className="text-slate-200 max-w-xl">Every piece tells a story. Watch as raw materials transform into your personal masterpiece through our expert hands.</p>
                     </div>
                 </div>
             </div>

             {/* The Ring that acts as the portal */}
             <div className="relative z-10 w-48 h-48 md:w-80 md:h-80 flex items-center justify-center pointer-events-none">
                <img 
                    ref={ringRef}
                    src="/ring.png" 
                    alt="Gold Craft Ring" 
                    className="w-full h-full object-contain drop-shadow-2xl"
                />
             </div>
       </div>
    </section>
  );
}