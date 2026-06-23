import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() { return handleEmailSend(); }
export async function POST() { return handleEmailSend(); }

async function handleEmailSend() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!gmailUser || !gmailPass || !adminEmail || !serviceRoleKey) {
    console.log("[cron:notify-emails] Skipping — missing GMAIL_USER, GMAIL_APP_PASSWORD, ADMIN_EMAIL, or SUPABASE_SERVICE_ROLE_KEY");
    return NextResponse.json({ skipped: true, reason: "missing env vars" });
  }

  const supabase = createClient(supabaseUrl!, serviceRoleKey);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, message, worker_id, created_at")
    .is("emailed_at", null)
    .order("created_at", { ascending: true })
    .limit(10);

  if (!notifications || notifications.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  let failed = 0;

  for (const n of notifications) {
    try {
      await transporter.sendMail({
        from: gmailUser,
        to: adminEmail,
        subject: `EQX: ${n.message}`,
        text: `${n.message}\n\nData: ${n.created_at}\nVer: https://eqx-folha-servico.vercel.app/hr/notifications`,
      });

      await supabase
        .from("notifications")
        .update({ emailed_at: new Date().toISOString() })
        .eq("id", n.id);
      sent++;
    } catch (err: any) {
      console.error("[cron:notify-emails] Gmail error:", err?.message || err);
      failed++;
    }
  }

  console.log(`[cron:notify-emails] Sent: ${sent}, Failed: ${failed}`);
  return NextResponse.json({ sent, failed });
}
