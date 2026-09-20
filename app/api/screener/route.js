import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 900;

const FALLBACK = [
  { ticker: "MSFT", name: "Microsoft", sector: "Technology", price: 421.5, changePercent: 0.8, score: 82, confidence: 85, longTermAllocation: 70, mediumTermAllocation: 30 },
  { ticker: "ASML", name: "ASML Holding", sector: "Semiconductors", price: 918.2, changePercent: 1.1, score: 80, confidence: 78, longTermAllocation: 72, mediumTermAllocation: 28 },
  { ticker: "AAPL", name: "Apple", sector: "Technology", price: 213.4, changePercent: 0.3, score: 76, confidence: 80, longTermAllocation: 68, mediumTermAllocation: 32 },
];

function score({ trailingPE, marketCap, changePercent }) {
  let longTerm = 45;
  if (trailingPE > 0 && trailingPE <= 30) longTerm += 15;
  if (marketCap > 100_000_000_000) longTerm += 15;
  const mediumTerm = Math.max(30, Math.min(85, 55 + (changePercent || 0) * 4));
  const global = Math.round(longTerm * 0.65 + mediumTerm * 0.35);
  return { score: global, confidence: 55, longTermAllocation: Math.round((longTerm / (longTerm + mediumTerm)) * 100), mediumTermAllocation: 0 };
}

export async function GET() {
  const symbols = ["MSFT", "AAPL", "ASML", "NVDA", "AMZN", "MC.PA"];
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
    const response = await fetch(url, { next: { revalidate: 900 }, headers: { "User-Agent": "HorizonResearch/1.0 contact@horizon.local" } });
    if (!response.ok) throw new Error(`Yahoo Finance returned ${response.status}`);
    const payload = await response.json();
    const opportunities = (payload.quoteResponse?.result || []).map((quote) => {
      const scored = score(quote);
      const longTermAllocation = scored.longTermAllocation;
      return {
        ticker: quote.symbol,
        name: quote.longName || quote.shortName || quote.symbol,
        sector: quote.quoteType === "ETF" ? "ETF" : "Actions",
        price: quote.regularMarketPrice ?? null,
        currency: quote.currency || "USD",
        changePercent: quote.regularMarketChangePercent ?? null,
        ...scored,
        longTermAllocation,
        mediumTermAllocation: 100 - longTermAllocation,
        source: "Yahoo Finance",
        sourceUrl: `https://finance.yahoo.com/quote/${quote.symbol}`,
      };
    }).sort((a, b) => b.score - a.score);
    return NextResponse.json({ mode: "live", updatedAt: new Date().toISOString(), opportunities });
  } catch (error) {
    return NextResponse.json({ mode: "demo", updatedAt: new Date().toISOString(), opportunities: FALLBACK, warning: "Données de démonstration : le fournisseur de marché est indisponible." });
  }
}
