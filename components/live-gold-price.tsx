"use client";

import { useState, useEffect } from "react";
import { getLiveGoldPriceINR } from "@/app/actions/gold-price";
import { TrendingUp, RefreshCw, IndianRupee } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function LiveGoldPrice() {
    const [isOpen, setIsOpen] = useState(false);
    const [priceData, setPriceData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchPrice = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getLiveGoldPriceINR();
            if (data.success) {
                setPriceData(data);
            } else {
                setError(data.error || "Failed to load");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && !priceData) {
            fetchPrice();
        }
    }, [isOpen]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button
                    className="p-2 cursor-pointer hover:bg-amber-50 rounded-full transition-colors text-slate-700 hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    title="Live Gold Price"
                >
                    <IndianRupee className="w-5 h-5" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white border border-amber-100 shadow-xl rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-serif tracking-wide text-stone-900">
                        <TrendingUp className="w-6 h-6 text-amber-500" />
                        Live Spot Price
                    </DialogTitle>
                    <DialogDescription className="text-stone-500">
                        Current global spot price for 24K Gold converted to Indian Rupees (INR).
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 flex flex-col items-center justify-center bg-stone-50 rounded-xl border border-stone-100 my-2 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-stone-200 rounded-full blur-2xl opacity-50 pointer-events-none" />

                    {loading ? (
                        <div className="flex flex-col items-center gap-3 animate-pulse">
                            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                            <p className="text-stone-400 text-sm">Fetching live market data...</p>
                        </div>
                    ) : error ? (
                        <div className="text-rose-500 text-center px-4">
                            <p className="font-medium mb-2">Unavailable</p>
                            <p className="text-sm">{error}</p>
                            <button
                                onClick={fetchPrice}
                                className="mt-4 text-xs uppercase tracking-widest text-amber-700 hover:text-amber-900 underline underline-offset-4"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : priceData ? (
                        <div className="w-full px-6 relative z-10">
                            <div className="flex flex-col items-center mb-6">
                                <span className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-1">Per 10 Grams (24K)</span>
                                <span className="text-4xl md:text-5xl font-serif text-amber-600 tracking-tight">
                                    {formatCurrency(priceData.tenGram)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="bg-white p-3 rounded-lg border border-stone-100 text-center shadow-sm">
                                    <span className="block text-stone-400 text-[10px] uppercase tracking-widest mb-1">Per Gram</span>
                                    <span className="text-lg font-medium text-stone-700">{formatCurrency(priceData.gram)}</span>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-stone-100 text-center shadow-sm">
                                    <span className="block text-stone-400 text-[10px] uppercase tracking-widest mb-1">Per Ounce</span>
                                    <span className="text-lg font-medium text-stone-700">{formatCurrency(priceData.ounce)}</span>
                                </div>
                            </div>

                            <p className="text-center text-[10px] text-stone-400 mt-6 max-w-xs mx-auto">
                                Prices are indicative spot rates and may not include local taxes, import duties, or making charges.
                            </p>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}