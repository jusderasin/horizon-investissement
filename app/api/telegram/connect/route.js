import { NextResponse } from "next/server";
import { createAdminClient, getUserFromBearer } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request) {
  const user = await getUserFromBearer(request);
  const admin = createAdminClient();
  if (!user) return NextResponse.json({ message: "Connexion Horizon requise." }, { status: 401 });
  const botUrl = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || "https://t.me/Horizon_invessementbot";
  if (!admin) return NextResponse.json({ message: "Le serveur de notifications n’est pas encore configuré." }, { status: 503 });
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_WEBHOOK_SECRET) return NextResponse.json({ message: "Ajoutez TELEGRAM_BOT_TOKEN et TELEGRAM_WEBHOOK_SECRET dans Vercel." }, { status: 503 });
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://horizon-investissement.vercel.app";
  const webhook = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: `${siteUrl}/api/telegram/webhook`, secret_token: process.env.TELEGRAM_WEBHOOK_SECRET, allowed_updates: ["message"] }) });
  if (!webhook.ok) return NextResponse.json({ message: "Telegram n’a pas accepté la connexion du bot." }, { status: 502 });
  const code = `HZN_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
  const { error } = await admin.from("telegram_pairing_tokens").upsert({ user_id: user.id, code, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ message: "Installez d’abord les tables Telegram dans Supabase." }, { status: 500 });
  return NextResponse.json({ url: `${botUrl}?start=${code}` });
}
