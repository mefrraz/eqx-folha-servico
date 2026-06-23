import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    return NextResponse.json({ error: "GMAIL_USER ou GMAIL_APP_PASSWORD nao configurados." }, { status: 500 });
  }

  const { workerIds, subject, body } = await request.json();
  if (!workerIds?.length || !subject || !body) {
    return NextResponse.json({ error: "workerIds, subject e body obrigatorios." }, { status: 400 });
  }

  // Fetch worker emails from Supabase
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", workerIds);

  if (!profiles?.length) {
    return NextResponse.json({ error: "Nenhum trabalhador encontrado." }, { status: 404 });
  }

  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: gmailUser, pass: gmailPass } });
  const logoUrl = "https://eqx-folha-servico.vercel.app/eqx-logo.svg";

  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sat = new Date(mon);
  sat.setDate(mon.getDate() + 5);

  const replaceVars = (text: string, w: any) =>
    text
      .replace(/{name}/g, w.full_name)
      .replace(/{email}/g, w.email)
      .replace(/{week_start}/g, mon.toLocaleDateString("pt"))
      .replace(/{week_end}/g, sat.toLocaleDateString("pt"))
      .replace(/{total_hours}/g, "—")
      .replace(/{sheets_count}/g, "—")
      .replace(/{obra_atual}/g, "—");

  let sent = 0;
  let failed = 0;

  for (const w of profiles) {
    try {
      const htmlBody = body
        .split("\n")
        .map((line: string) => `<p style="margin:0 0 8px">${line || "&nbsp;"}</p>`)
        .join("");

      await transporter.sendMail({
        from: gmailUser,
        to: w.email,
        subject: replaceVars(subject, w),
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#F7F7F7">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F7;padding:20px 0">
<tr><td align="center">
<table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
  <tr><td style="background:#fff;padding:24px 30px 16px;text-align:center;border-bottom:3px solid #F1C411">
    <img src="${logoUrl}" alt="EQX" style="height:36px" />
  </td></tr>
  <tr><td style="padding:30px">
    <h2 style="margin:0 0 15px;color:#1a1a1a;font-size:18px">${replaceVars(subject, w)}</h2>
    ${replaceVars(htmlBody, w)}
  </td></tr>
  <tr><td style="background:#F7F7F7;padding:15px 30px;border-top:1px solid #eee">
    <p style="margin:0;color:#aaa;font-size:11px;font-style:italic">Enviado automaticamente pela plataforma EQX Folha de Servico.</p>
  </td></tr>
</table>
</td></tr></table></body></html>`,
      });
      sent++;
    } catch (err: any) {
      console.error("[send-emails] error:", err?.message);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}
