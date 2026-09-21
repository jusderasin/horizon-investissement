import { NextResponse } from "next/server";
import { formatAlert, postTelegram } from "../../../../lib/alerts/engine";
import { createAdminClient, getUserFromBearer } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request) {
  const user = await getUserFromBearer(request);
  const admin = createAdminClient();
  if (!user) return NextResponse.json({ message: "Connexion Horizon requise." }, { status: 401 });
  if (!admin) return NextResponse.json({ message: "Serveur d’alertes indisponible." }, { status: 503 });
  const { data: connection } = await admin.from("telegram_connections").select("chat_id").eq("user_id", user.id).eq("active", true).maybeSingle();
  if (!connection) return NextResponse.json({ message: "Associez d’abord votre Telegram à Horizon." }, { status: 409 });
  const event = { type: "markets", importance: 80, title: "Test Horizon — alerte personnelle", summary: "Votre canal Telegram privé est prêt. Les prochains événements ne seront envoyés que s’ils correspondent à vos réglages.", sourceName: "Horizon test", sourceUrl: "https://horizon-investissement.vercel.app", symbols: [], test: true };
  const result = await postTelegram(connection.chat_id, formatAlert(event));
  return NextResponse.json({ delivered: result.delivered, message: result.delivered ? "Alerte envoyée sur Telegram." : result.reason });
}
