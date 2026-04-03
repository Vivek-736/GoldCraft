"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type MarketChartProps = {
  data: Array<{ date: string; price: number }>;
};

export function MarketChart({ data }: MarketChartProps) {
  const formatINR = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="h-[300px] w-full md:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            minTickGap={30}
          />
          <YAxis
            hide
            domain={["dataMin - 100", "dataMax + 100"]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-amber-100 bg-white p-3 shadow-xl">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {payload[0].payload.date}
                    </p>
                    <p className="mt-1 text-lg font-bold text-amber-900">
                      {formatINR(payload[0].value as number)}
                      <span className="ml-1 text-[10px] font-medium text-slate-400">/g</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#d97706"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPrice)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}