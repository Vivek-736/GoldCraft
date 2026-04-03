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
          margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={true} horizontal={true} />
          <XAxis
            dataKey="date"
            axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12, dy: 10 }}
            minTickGap={40}
          />
          <YAxis
            domain={["dataMin - 500", "dataMax + 500"]}
            axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12, dx: -5 }}
            tickFormatter={(value) => `₹${value.toLocaleString()}`}
            width={70}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-stone-100 bg-white p-3 shadow-lg">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                      {payload[0].payload.date}
                    </p>
                    <p className="text-base font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full border-2 border-amber-400 bg-white inline-block"></span>
                      {formatINR(payload[0].value as number)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
            cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#fbbf24"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrice)"
            animationDuration={1500}
            activeDot={{ r: 5, fill: "#ffffff", stroke: "#fbbf24", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}