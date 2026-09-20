import { NextResponse } from "next/server";

export const runtime = "nodejs";

function fallbackReport(ticker) {
  return {
    mode: "demo",
    summary: `${ticker} doit être analysé à partir de ses publications officielles avant toute décision.`,
    moat: "Rapport IA non configuré : documentez les avantages concurrentiels à partir des sources primaires.",
    risks: ["Valorisation", "Exécution opérationnelle", "Conjoncture et réglementation"],
    sources: [
      { label: "SEC EDGAR", url: "https://www.sec.gov/edgar/search/" },
      { label: "Yahoo Finance", url: `https://finance.yahoo.com/quote/${ticker}` },
    ],
  };
}

export async function POST(request) {
  const { ticker } = await request.json();
  if (!ticker || !/^[A-Z0-9.^-]{1,12}$/i.test(ticker)) return NextResponse.json({ error: "Ticker invalide." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json(fallbackReport(ticker));
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: `Analyse fondamentale prudente en français pour ${ticker}. Réponds en JSON avec summary, moat, risks (tableau), sources (tableau label/url). Ne donne aucun conseil d'achat/vente ni prix cible.`,
        text: { format: { type: "json_object" } },
      }),
    });
    if (!response.ok) throw new Error("LLM unavailable");
    const body = await response.json();
    const raw = body.output_text || body.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
    return NextResponse.json({ mode: "live", ...JSON.parse(raw) });
  } catch {
    return NextResponse.json(fallbackReport(ticker));
  }
}
