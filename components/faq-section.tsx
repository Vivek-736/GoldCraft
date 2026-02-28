"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

interface FaqItem {
    id: string;
    question: string;
    answer: string;
}

const faqs: FaqItem[] = [
    {
        id: "01",
        question: "How does the AI customization process work?",
        answer:
            "Our cutting-edge AI assistant guides you through the design process. You describe your vision, select preferences, and the AI generates stunning 3D models in real-time. You can tweak every detail—from the metal type to gem placement—until it's absolutely perfect.",
    },
    {
        id: "02",
        question: "Can I bring my own design or sketch?",
        answer:
            "Absolutely. You can upload any sketch or reference image to our platform. Our AI interprets your design and creates a high-fidelity 3D rendering that our master craftsmen will use as a blueprint to forge your piece.",
    },
    {
        id: "03",
        question: "What materials do you use for custom pieces?",
        answer:
            "We source only the highest quality, conflict-free materials. Choose from 18k Yellow, White, or Rose Gold, Platinum, and a curated selection of ethically sourced diamonds and precious gemstones.",
    },
    {
        id: "04",
        question: "How long does it take to craft a custom jewelry piece?",
        answer:
            "Once your AI-generated 3D design is approved, our artisans begin the crafting process. Typically, a custom piece takes between 2 to 4 weeks to be cast, set, polished, and delivered to your doorstep in premium packaging.",
    },
    {
        id: "05",
        question: "Is there a warranty on custom-designed jewelry?",
        answer:
            "Yes. Every GoldCraft piece comes with a lifetime authenticity guarantee and a dedicated 2-year warranty covering any manufacturing defects. We stand behind the enduring quality of our craftsmanship.",
    },
    {
        id: "06",
        question: "What forms of payment do you accept?",
        answer:
            "We accept all major credit cards, PayPal, bank transfers, and offer flexible financing options through our partners to make your dream jewelry a reality.",
    }
];

export function FaqSection() {
    const [openId, setOpenId] = useState<string | null>(null);

    const toggleOpen = (id: string) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <section id="faq" className="w-full min-h-screen flex items-center justify-center py-24 bg-white relative overflow-hidden">

            <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-7xl">
                <div className="max-w-2xl text-center mx-auto mb-12 md:mb-16">
                    <h2 className="text-4xl md:text-5xl lg:text-7xl font-serif text-black mb-6 tracking-tight">
                        FAQ's
                    </h2>
                    <p className="text-stone-600 text-lg md:text-xl font-light leading-relaxed">
                        We're here to help you and solve doubts. Find answers to the most common questions below.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
                    {faqs.map((faq) => {
                        const isOpen = openId === faq.id;

                        return (
                            <motion.div
                                key={faq.id}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4 }}
                                className={`border rounded-lg bg-white overflow-hidden transition-all duration-300 ${isOpen ? "border-amber-500 shadow-md shadow-amber-500/10" : "border-stone-200 hover:border-black"
                                    }`}
                            >
                                <button
                                    onClick={() => toggleOpen(faq.id)}
                                    className="w-full flex items-center justify-between p-5 md:p-6 text-left group cursor-pointer bg-white"
                                >
                                    <h3
                                        className={`text-base md:text-lg font-medium pr-6 transition-colors duration-300 ${isOpen ? "text-amber-600" : "text-black group-hover:text-amber-500"
                                            }`}
                                    >
                                        {faq.question}
                                    </h3>
                                    <div
                                        className="shrink-0 transition-all duration-300"
                                    >
                                        {isOpen ? (
                                            <Minus className="w-5 h-5 text-amber-500" />
                                        ) : (
                                            <Plus className="w-5 h-5 text-stone-400 group-hover:text-black" />
                                        )}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            <div className="px-5 md:px-6 pb-6 pt-2 border-t border-stone-100">
                                                <p className="text-stone-600 font-light leading-relaxed text-sm md:text-base">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}