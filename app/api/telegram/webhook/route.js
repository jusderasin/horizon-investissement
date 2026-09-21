import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { postTelegram } from "../../../../lib/alerts/engine";

export const runtime = "nodejs";

export async function POST(request) {
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || request.headers.get("x-telegram-bot-api-secret-token") !== process.env.TELEGRAM_WEBHOOK_SECRET) return new NextResponse("Unauthorized", { status: 401 });
  const update = await request.json();
  const message = update.message;
  const text = message?.text || "";
  const chatId = message?.chat?.id;
  const code = text.match(/^\/start\s+(HZN_[A-Za-z0-9_-]{8,})/)?.[1];
  const admin = createAdminClient();
  if (!chatId || !admin) return NextResponse.json({ ok: true });
  if (!code) { await postTelegram(chatId, "Bienvenue dans Horizon. Connectez votre espace Horizon depuis la page Alertes personnelles pour recevoir vos alertes privées."); return NextResponse.json({ ok: true }); }
  const { data: pairing } = await admin.from("telegram_pairing_tokens").select("user_id").eq("code", code).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (!pairing) { await postTelegram(chatId, "Ce lien Horizon est expiré. Retournez dans votre espace Horizon et générez un nouveau lien Telegram."); return NextResponse.json({ ok: true }); }
  await admin.from("telegram_connections").upsert({ user_id: pairing.user_id, chat_id: String(chatId), telegram_username: message.from?.username || null, active: true, connected_at: new Date().toISOString() }, { onConflict: "user_id" });
  await admin.from("telegram_pairing_tokens").delete().eq("user_id", pairing.user_id);
  await postTelegram(chatId, "✅ Telegram est connecté à Horizon. Vos prochaines alertes respecteront vos préférences personnelles.");
  return NextResponse.json({ ok: true });
}
