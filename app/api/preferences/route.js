import { NextResponse } from "next/server";
import { createAdminClient, getUserFromBearer } from "../../../lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request) {
  const user = await getUserFromBearer(request);
  const admin = createAdminClient();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (!admin) return NextResponse.json({ message: "Synchronisation indisponible." }, { status: 503 });
  const body = await request.json();
  const threshold = Math.max(50, Math.min(95, Number(body.threshold) || 75));
  const profile = await admin.from("profiles").upsert({ id: user.id, display_name: String(body.name || "").slice(0, 80), risk_profile: String(body.risk || "Modéré").slice(0, 40), excluded_sectors: String(body.sectors || "").slice(0, 500), updated_at: new Date().toISOString() });
  const preferences = await admin.from("alert_preferences").upsert({ user_id: user.id, score_threshold: threshold, telegram_enabled: Boolean(body.telegram), in_app_enabled: Boolean(body.inApp), discord_enabled: true, updated_at: new Date().toISOString() });
  if (profile.error || preferences.error) return NextResponse.json({ message: "Les tables Supabase doivent être installées." }, { status: 500 });
  return NextResponse.json({ saved: true });
}
