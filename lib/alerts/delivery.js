import { createAdminClient } from "../supabase/admin";
import { formatAlert, postDiscord, postTelegram } from "./engine";

export async function deliverAlert(event) {
  const content = formatAlert(event);
  const admin = createAdminClient();
  const discord = await postDiscord(content);

  if (!admin) return { event, discord, telegram: { delivered: 0, skipped: "Supabase service role manquant" } };

  const { data: alert, error: insertError } = await admin
    .from("market_alerts")
    .insert({
      type: event.type,
      importance: event.importance,
      title: event.title,
      summary: event.summary,
      source_name: event.sourceName,
      source_url: event.sourceUrl,
      symbols: event.symbols,
      test: event.test,
    })
    .select("id")
    .single();

  if (insertError) return { event, discord, telegram: { delivered: 0, skipped: "Enregistrement de l'alerte impossible" } };

  const { data: preferences } = await admin
    .from("alert_preferences")
    .select("user_id, score_threshold")
    .eq("telegram_enabled", true)
    .lte("score_threshold", event.importance);
  const ids = (preferences || []).map((item) => item.user_id);
  const { data: connections } = ids.length
    ? await admin.from("telegram_connections").select("user_id, chat_id").eq("active", true).in("user_id", ids)
    : { data: [] };

  let delivered = 0;
  for (const connection of connections || []) {
    const result = await postTelegram(connection.chat_id, content);
    if (result.delivered) delivered += 1;
    await admin.from("alert_deliveries").insert({
      alert_id: alert.id,
      user_id: connection.user_id,
      channel: "telegram",
      status: result.delivered ? "delivered" : "failed",
    });
  }
  return { event, discord, telegram: { delivered, eligible: (connections || []).length } };
}
