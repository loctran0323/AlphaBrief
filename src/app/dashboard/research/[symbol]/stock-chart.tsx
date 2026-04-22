"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartPoint, ChartRange } from "@/lib/stock-research";

const RANGES: { label: string; value: ChartRange }[] = [
  { label: "1D", value: "1d" },
  { label: "1W", value: "5d" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "1Y", value: "1y" },
];

function formatTs(ts: number, range: ChartRange): string {
  const d = new Date(ts);
  if (range === "1d") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (range === "5d") {
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

type Props = {
  symbol: string;
  initialData: ChartPoint[];
  initialRange: ChartRange;
  isPositive: boolean;
};

export function StockChart({ symbol, initialData, initialRange, isPositive }: Props) {
  const [range, setRange] = useState<ChartRange>(initialRange);
  const [data, setData] = useState<ChartPoint[]>(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (range === initialRange) { setData(initialData); return; }
    setLoading(true);
    fetch(`/api/research/chart?symbol=${symbol}&range=${range}`)
      .then((r) => r.json())
      .then((j: { data: ChartPoint[] }) => { setData(j.data); })
      .finally(() => setLoading(false));
  }, [range, symbol, initialData, initialRange]);

  const color = isPositive ? "#10b981" : "#ef4444";
  const gradientId = `grad-${symbol}`;

  const minVal = data.length ? Math.min(...data.map((d) => d.close)) : 0;
  const maxVal = data.length ? Math.max(...data.map((d) => d.close)) : 0;
  const padding = (maxVal - minVal) * 0.1 || 1;

  return (
    <div>
      {/* Range selector */}
      <div className="mb-4 flex gap-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
              range === r.value
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className={`relative h-56 transition-opacity ${loading ? "opacity-40" : ""}`}>
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--faint)]">
            No chart data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="ts"
                tickFormatter={(v: number) => formatTs(v, range)}
                tick={{ fontSize: 10, fill: "var(--muted)" }}
                tickLine={false}
                axisLine={false}
                minTickGap={60}
              />
              <YAxis
                domain={[minVal - padding, maxVal + padding]}
                tick={{ fontSize: 10, fill: "var(--muted)" }}
                tickLine={false}
                axisLine={false}
                width={55}
                tickFormatter={(v: number) => `$${v.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(v) => new Date(v as number).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                formatter={(v) => [`$${(v as number).toFixed(2)}`, "Price"]}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 3, fill: color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
