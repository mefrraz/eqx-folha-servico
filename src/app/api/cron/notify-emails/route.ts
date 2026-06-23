import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { startOfWeek, subDays, format } from "date-fns";

export async function GET() { return handleCron(); }
export async function POST() { return handleCron(); }

async function handleCron() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!gmailUser || !gmailPass || !adminEmail || !serviceRoleKey) {
    return NextResponse.json({ skipped: true, reason: "missing env vars" });
  }

  const supabase = createClient(supabaseUrl!, serviceRoleKey);
  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: gmailUser, pass: gmailPass } });
  const logoUrl = "https://eqx-folha-servico.vercel.app/eqx-logo.svg";

  const results: any = {};

  // ── 1. Send notification emails to admin ──
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, message, created_at")
    .is("emailed_at", null)
    .order("created_at", { ascending: true })
    .limit(10);

  if (notifications && notifications.length > 0) {
    let sent = 0, failed = 0;
    for (const n of notifications) {
      try {
        await transporter.sendMail({
          from: gmailUser,
          to: adminEmail,
          subject: `EQX: ${n.message}`,
          html: emailTemplate("Nova folha submetida", n.message, `Data: ${n.created_at}`),
        });
        await supabase.from("notifications").update({ emailed_at: new Date().toISOString() }).eq("id", n.id);
        sent++;
      } catch (err: any) { console.error("[cron] notify error:", err?.message); failed++; }
    }
    console.log(`[cron] Notifications — Sent: ${sent}, Failed: ${failed}`);
    results.notifications = { sent, failed };
  }

  // ── 2. Sunday reminder to workers without sheet ──
  const today = new Date();
  if (today.getDay() === 0) { // Sunday
    const lastMonday = format(startOfWeek(subDays(today, 7), { weekStartsOn: 1 }), "yyyy-MM-dd");

    // Get all workers
    const { data: workers } = await supabase.from("profiles").select("id, full_name, email").eq("role", "worker");
    // Get workers who already submitted for last week
    const { data: submitted } = await supabase.from("work_sheets").select("worker_id").eq("week_start", lastMonday);

    const submittedIds = new Set((submitted || []).map(s => s.worker_id));
    const missing = (workers || []).filter(w => !submittedIds.has(w.id) && w.email);

    let reminded = 0, remindFailed = 0;
    for (const w of missing) {
      try {
        await transporter.sendMail({
          from: gmailUser,
          to: w.email,
          subject: "EQX — Folha de servico pendente",
          html: emailTemplate(
            `Ola ${w.full_name}`,
            `A folha de servico da semana passada ainda nao foi submetida. Por favor, submeta a sua folha.`,
            `Aceda: https://eqx-folha-servico.vercel.app/worker/dashboard`
          ),
        });
        reminded++;
      } catch (err: any) { console.error("[cron] reminder error:", err?.message); remindFailed++; }
    }
    console.log(`[cron] Sunday reminders — Sent: ${reminded}, Failed: ${remindFailed}`);
    results.reminders = { sent: reminded, failed: remindFailed };

    // ── 3. Weekly stats to ALL workers ──
    const { data: allWorkers } = await supabase.from("profiles").select("id, full_name, email").eq("role", "worker");
    const { data: weekSheets } = await supabase.from("work_sheets").select("worker_id, work_entries(*)").eq("week_start", lastMonday);

    let statsSent = 0, statsFailed = 0;
    for (const w of (allWorkers || [])) {
      if (!w.email) continue;
      const workerSheets = (weekSheets || []).filter((s: any) => s.worker_id === w.id);
      const mins = workerSheets.reduce((sum: number, s: any) => {
        return sum + (s.work_entries || []).reduce((s2: number, e: any) => {
          if (e.start_time && e.end_time) {
            const [sh, sm] = e.start_time.split(":").map(Number);
            const [eh, em] = e.end_time.split(":").map(Number);
            return s2 + (eh * 60 + em) - (sh * 60 + sm);
          }
          return s2;
        }, 0);
      }, 0);
      const hours = Math.floor(mins / 60);
      const minsRem = mins % 60;
      const totalHours = minsRem > 0 ? `${hours}h ${minsRem}m` : `${hours}h`;

      try {
        await transporter.sendMail({
          from: gmailUser,
          to: w.email,
          subject: "EQX — Resumo da semana",
          html: emailTemplate(
            `Ola ${w.full_name}`,
            `Resumo da semana passada:<br><br>Total de horas: <strong>${totalHours}</strong><br>Folhas submetidas: <strong>${workerSheets.length}</strong><br><br>Continue o bom trabalho!`,
            `Veja o seu historico em: https://eqx-folha-servico.vercel.app/worker/dashboard`
          ),
        });
        statsSent++;
      } catch (err: any) { console.error("[cron] stats error:", err?.message); statsFailed++; }
    }
    console.log(`[cron] Weekly stats — Sent: ${statsSent}, Failed: ${statsFailed}`);
    results.stats = { sent: statsSent, failed: statsFailed };
  }

  return NextResponse.json(results);
}

function emailTemplate(title: string, body: string, footer: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#F7F7F7">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F7;padding:20px 0">
<tr><td align="center">
<table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
  <tr><td style="background:#fff;padding:24px 30px 16px;text-align:center;border-bottom:3px solid #F1C411">
    <img src="https://eqx-folha-servico.vercel.app/eqx-logo.svg" alt="EQX" style="height:36px" />
  </td></tr>
  <tr><td style="padding:30px">
    <h2 style="margin:0 0 10px;color:#1a1a1a;font-size:18px">${title}</h2>
    <p style="margin:0 0 15px;color:#54595F;font-size:14px;line-height:1.6">${body}</p>
    <p style="margin:0;color:#7A7A7A;font-size:12px">${footer}</p>
  </td></tr>
  <tr><td style="background:#F7F7F7;padding:15px 30px;border-top:1px solid #eee">
    <p style="margin:0;color:#aaa;font-size:11px;font-style:italic">Enviado automaticamente pela plataforma EQX Folha de Servico.</p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}
