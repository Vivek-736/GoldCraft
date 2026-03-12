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
        question: "How does the customization process work?",
        answer:
            "Our process is focused on manually customizing the color and visual finish of existing CAD models. You choose the direction you want, and we refine the presentation around prepared model options rather than generating brand-new CAD files with AI.",
    },
    {
        id: "02",
        question: "Can I bring my own design or sketch?",
        answer:
            "Absolutely. You can share a sketch or reference image to communicate the style you want. We use that input to guide the customization of suitable existing CAD options and their visual treatment, especially color direction and presentation.",
    },
    {
        id: "03",
        question: "Do designed jewelry pieces come with a warranty?",
        answer:
            "No, we do not offer a warranty at this time. If you have questions before placing an order, we recommend confirming every customization detail with us in advance so expectations are fully clear.",
    },
    {
        id: "04",
        question: "How long does it take to craft a custom jewelry piece?",
        answer:
            "Once your selected customization is finalized, our team moves forward with the production workflow. Timelines can vary based on the piece and finishing requirements, but we keep the process clear and coordinated from approval through delivery.",
    },
    {
        id: "05",
        question: "What materials do you use for custom pieces?",
        answer:
            "We source only the highest quality, conflict-free materials. Choose from 18k Yellow, White, or Rose Gold, Platinum, and a curated selection of ethically sourced diamonds and precious gemstones.",
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
                        FAQ&apos;s
                    </h2>
                    <p className="text-stone-600 text-lg md:text-xl font-light leading-relaxed">
                        We&apos;re here to help you and solve doubts. Find answers to the most common questions below.
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