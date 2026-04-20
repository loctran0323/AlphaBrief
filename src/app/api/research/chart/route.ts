import { type NextRequest, NextResponse } from "next/server";
import { fetchStockChart, type ChartRange } from "@/lib/stock-research";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();
  const range = (searchParams.get("range") ?? "3mo") as ChartRange;

  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  const data = await fetchStockChart(symbol, range);
  return NextResponse.json({ data });
}
