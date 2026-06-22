import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Vercel Cron calls this every minute — only process if we have Resend configured
export async function GET() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!resendApiKey || !adminEmail || !serviceRoleKey) {
    console.log("[cron:notify-emails] Skipping — missing RESEND_API_KEY, ADMIN_EMAIL, or SUPABASE_SERVICE_ROLE_KEY");
    return NextResponse.json({ skipped: true, reason: "missing env vars" });
  }

  const supabase = createClient(supabaseUrl!, serviceRoleKey);

  // Find notifications that haven't been emailed yet (last 60 min to be safe)
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
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "EQX Folha de Serviço <notifications@eqx.pt>",
          to: [adminEmail],
          subject: `📋 ${n.message}`,
          text: `${n.message}\n\nData: ${n.created_at}\nVer em: https://eqx-folha-servico.vercel.app/hr/notifications`,
        }),
      });

      if (response.ok) {
        await supabase
          .from("notifications")
          .update({ emailed_at: new Date().toISOString() })
          .eq("id", n.id);
        sent++;
      } else {
        const err = await response.text();
        console.error("[cron:notify-emails] Resend error:", response.status, err);
        failed++;
      }
    } catch (err) {
      console.error("[cron:notify-emails] Fetch error:", err);
      failed++;
    }
  }

  console.log(`[cron:notify-emails] Sent: ${sent}, Failed: ${failed}`);
  return NextResponse.json({ sent, failed });
}
