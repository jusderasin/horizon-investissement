const feeds = [
  { name: "Federal Reserve", url: "https://www.federalreserve.gov/feeds/press_all.xml", type: "central_bank" },
  { name: "U.S. Treasury", url: "https://home.treasury.gov/news/press-releases/feed", type: "macro" },
  { name: "European Central Bank", url: "https://www.ecb.europa.eu/rss/press.html", type: "central_bank" },
];

const decode = (value = "") => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
const field = (xml, name) => (xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i")) || [])[1] || "";

function feedItems(xml, source) {
  const records = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) || [];
  return records.slice(0, 12).map((record) => {
    const title = decode(field(record, "title"));
    const linkMatch = record.match(/<link[^>]+href=["']([^"']+)["']/i);
    const url = linkMatch?.[1] || decode(field(record, "link"));
    const description = decode(field(record, "description") || field(record, "summary") || field(record, "content"));
    return { ...source, title, url, description };
  }).filter((item) => item.title && /^https:\/\//.test(item.url));
}

function classify(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  let importance = 68;
  if (/fomc|interest rate|monetary policy|emergency|sanction|war|inflation|employment|gdp|tariff/.test(text)) importance += 18;
  if (/statement|minutes|speech|auction|report/.test(text)) importance += 6;
  const symbols = /oil|energy|iran|opec/.test(text) ? ["XLE", "USO"] : /bank|liquidity|credit/.test(text) ? ["XLF"] : [];
  return {
    type: item.type,
    importance: Math.min(95, importance),
    title: item.title,
    summary: item.description ? item.description.slice(0, 620) : "Publication officielle disponible. Consultez la source avant toute décision.",
    sourceName: item.name,
    sourceUrl: item.url,
    symbols,
    test: false,
  };
}

export async function collectOfficialEvents() {
  const settled = await Promise.allSettled(feeds.map(async (feed) => {
    const response = await fetch(feed.url, { headers: { "User-Agent": "HorizonResearchOS/1.0 contact@horizon-investissement.app" }, next: { revalidate: 0 } });
    if (!response.ok) throw new Error(`${feed.name}: ${response.status}`);
    return feedItems(await response.text(), feed).map(classify);
  }));
  const events = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const errors = settled.filter((result) => result.status === "rejected").map((result) => result.reason.message);
  return { events, errors };
}

function marketLens(event) {
  const text = `${event.title} ${event.summary}`.toLowerCase();
  if (/inflation|interest rate|monetary policy|fomc|central bank/.test(text)) return "Taux, devises et valeurs de croissance à surveiller.";
  if (/tariff|sanction|war|energy|oil|opec/.test(text)) return "Énergie, inflation et actifs refuges peuvent être sensibles.";
  if (/employment|gdp|consumer|retail|manufactur/.test(text)) return "Le cycle économique et les secteurs cycliques sont à suivre.";
  if (/bank|liquidity|credit|treasury/.test(text)) return "Crédit, banques et conditions financières à surveiller.";
  return "Lire la publication : elle peut modifier le contexte macroéconomique.";
}

export function buildMorningFundamental(events, date = new Date()) {
  const selected = [...events].sort((a, b) => b.importance - a.importance).slice(0, 3);
  const weekly = date.getUTCDay() === 1;
  const lines = selected.map((event, index) => `${index + 1}. ${event.title.slice(0, 95)}\n   → ${marketLens(event)}\n   ${event.sourceName}: ${event.sourceUrl.slice(0, 160)}`).join("\n\n");
  return {
    type: "macro",
    importance: 88,
    title: weekly ? "Horizon | Morning Fundamental + cap de semaine" : "Horizon | Morning Fundamental",
    summary: `${weekly ? "CAP DE SEMAINE — " : ""}Le point fondamental du matin : faits vérifiables, contexte et liens de lecture.\n\n${lines || "Aucune nouvelle publication officielle n'a été détectée ce matin. Consultez les banques centrales et le calendrier économique avant toute décision."}\n\nÀ retenir : ce brief organise l'information, il ne constitue pas une recommandation d'investissement.`,
    sourceName: "Horizon Research — sources officielles + ING Think",
    sourceUrl: "https://think.ing.com/search/results/",
    symbols: [],
    test: false,
  };
}
