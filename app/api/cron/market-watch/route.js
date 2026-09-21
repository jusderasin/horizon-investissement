import { NextResponse } from "next/server";
import { deliverAlert } from "../../../../lib/alerts/delivery";
import { collectOfficialEvents } from "../../../../lib/alerts/sources";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { events, errors } = await collectOfficialEvents();
  const admin = createAdminClient();
  let skipped = 0;
  const deliveries = [];

  for (const event of events) {
    const { data: existing } = admin ? await admin.from("market_alerts").select("id").eq("source_url", event.sourceUrl).limit(1) : { data: [] };
    if (existing?.length) {
      skipped += 1;
      continue;
    }
    deliveries.push(await deliverAlert(event));
  }

  return NextResponse.json({ checked: events.length, delivered: deliveries.length, skipped, errors, deliveries });
}
