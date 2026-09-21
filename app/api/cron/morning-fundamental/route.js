import { NextResponse } from "next/server";
import { deliverAlert } from "../../../../lib/alerts/delivery";
import { buildMorningFundamental, collectOfficialEvents } from "../../../../lib/alerts/sources";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { events, errors } = await collectOfficialEvents();
  const report = buildMorningFundamental(events);
  const delivery = await deliverAlert(report);
  return NextResponse.json({ report: { title: report.title, sourcesChecked: events.length }, errors, delivery });
}
