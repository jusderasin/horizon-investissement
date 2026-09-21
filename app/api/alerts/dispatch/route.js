import { NextResponse } from "next/server";
import { normalizeAlert } from "../../../../lib/alerts/engine";
import { deliverAlert } from "../../../../lib/alerts/delivery";

export const runtime = "nodejs";

export async function POST(request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse("Unauthorized", { status: 401 });
  const event = normalizeAlert(await request.json());
  return NextResponse.json(await deliverAlert(event));
}
