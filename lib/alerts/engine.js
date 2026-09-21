export const alertTypes = ["macro", "central_bank", "geopolitics", "company", "markets", "crypto", "social"];

export function normalizeAlert(input = {}) {
  const type = alertTypes.includes(input.type) ? input.type : "markets";
  return { type, importance: Math.max(50, Math.min(100, Number(input.importance) || 75)), title: String(input.title || "Événement de marché").slice(0, 180), summary: String(input.summary || "Nouvelle information à vérifier.").slice(0, 900), sourceName: String(input.sourceName || "Source à vérifier").slice(0, 100), sourceUrl: /^https:\/\//.test(input.sourceUrl || "") ? input.sourceUrl : null, symbols: Array.isArray(input.symbols) ? input.symbols.map(String).slice(0, 12) : [], test: Boolean(input.test) };
}

export function formatAlert(event) {
  const symbols = event.symbols.length ? `\nActifs concernés : ${event.symbols.join(", ")}` : "";
  const source = event.sourceUrl ? `\nSource : ${event.sourceUrl}` : "";
  return `🔎 Horizon | ${event.type}\n\n${event.title}\n\n${event.summary}${symbols}\n\nImportance : ${event.importance}/100\nSource : ${event.sourceName}${source}\n\nÀ analyser dans Horizon — information de recherche, pas un conseil financier.`;
}

export async function postDiscord(content) {
  if (!process.env.DISCORD_WEBHOOK_URL) return { delivered: false, reason: "Discord non configuré" };
  const response = await fetch(process.env.DISCORD_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
  return { delivered: response.ok, reason: response.ok ? undefined : "Discord a refusé le message" };
}

export async function postTelegram(chatId, content) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return { delivered: false, reason: "Telegram non configuré" };
  const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text: content, disable_web_page_preview: true }) });
  return { delivered: response.ok, reason: response.ok ? undefined : "Telegram a refusé le message" };
}
