"use client";

import { useEffect, useMemo, useState } from "react";

type BalanceResponse = {
  credits?: number;
  error?: string;
};

function toneForCredits(credits: number) {
  if (credits <= 1) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (credits <= 2) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function DashboardCreditsPill() {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/credits/balance", {
          cache: "no-store",
        });

        const payload = (await response.json()) as BalanceResponse;

        if (!response.ok || !Number.isFinite(payload.credits)) {
          return;
        }

        if (!cancelled) {
          setCredits(Number(payload.credits));
        }
      } catch {
        // Ignore badge fetch errors in nav.
        console.log("Failed to load credits balance");
      }
    };

    void load();

    const handleCreditsUpdated = () => {
      void load();
    };

    window.addEventListener("credits:updated", handleCreditsUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("credits:updated", handleCreditsUpdated);
    };
  }, []);

  const displayCredits = credits ?? 4;

  const toneClassName = useMemo(() => {
    return toneForCredits(displayCredits);
  }, [displayCredits]);

  return (
    <div
      className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.12em] ${toneClassName}`}
      title={`${displayCredits} credits remaining`}
    >
      {displayCredits} Credits
    </div>
  );
}