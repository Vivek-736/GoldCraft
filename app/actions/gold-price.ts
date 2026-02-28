"use server";

export async function getLiveGoldPriceINR() {
    try {
        const goldResponse = await fetch("https://api.gold-api.com/price/XAU", {
            cache: 'no-store'
        });

        if (!goldResponse.ok) {
            throw new Error("Failed to fetch gold price");
        }
        const goldData = await goldResponse.json();
        const priceUSD = goldData.price;

        const fxResponse = await fetch("https://open.er-api.com/v6/latest/USD", {
            next: { revalidate: 3600 }
        });

        if (!fxResponse.ok) {
            throw new Error("Failed to fetch exchange rate");
        }
        const fxData = await fxResponse.json();

        const usdToInr = fxData.rates.INR;
        const ouncePriceINR = priceUSD * usdToInr;
        const gramPriceINR = ouncePriceINR / 31.1034768;
        const tenGramPriceINR = gramPriceINR * 10;

        return {
            success: true,
            ounce: ouncePriceINR,
            gram: gramPriceINR,
            tenGram: tenGramPriceINR,
            currency: "INR"
        };
    } catch (error) {
        console.error("Error fetching gold price:", error);

        return {
            success: false,
            error: "Failed to load live price"
        };
    }
}