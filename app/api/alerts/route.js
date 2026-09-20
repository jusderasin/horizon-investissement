import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
  const { ticker, score, horizon } = await request.json();
  if (!process.env.DISCORD_WEBHOOK_URL) {
    return NextResponse.json({ delivered: false, message: "Webhook Discord non configuré." });
  }
  const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `🔎 **Horizon — signal de recherche**\nActif : **${ticker}**\nScore : **${score}/100**\nHorizon : **${horizon}**\nÀ vérifier dans Horizon ; ceci n’est pas un conseil financier.` }),
  });
  if (!response.ok) return NextResponse.json({ delivered: false, message: "Échec de livraison Discord." }, { status: 502 });
  return NextResponse.json({ delivered: true });
}
