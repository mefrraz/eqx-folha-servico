import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { DAY_LABELS, WORK_TYPE_LABELS } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: sheet } = await supabase.from("work_sheets").select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name)").eq("id", params.id).single();
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const DL = DAY_LABELS;
  const WT = WORK_TYPE_LABELS;

  const td = "border:1px solid #999;padding:4px 6px;font-size:10px;font-family:Arial;vertical-align:top";
  const th = "border:1px solid #999;padding:4px 6px;font-size:9px;font-family:Arial;font-weight:bold;background:#e8e8e8;text-align:left;white-space:nowrap";

  const rows = ["monday","tuesday","wednesday","thursday","friday","saturday"].map(day => {
    const e = (sheet.work_entries || []).find((x: any) => x.day === day);
    return `<tr>
      <td style="${td};font-weight:bold">${DL[day]}</td>
      <td style="${td}">${e?.work_description || ""}</td>
      <td style="${td}">${WT[e?.work_type] || ""}</td>
      <td style="${td};text-align:center">${e?.date || ""}</td>
      <td style="${td};text-align:center">${e?.evaluation || ""}</td>
      <td style="${td};text-align:center">${e?.signature || ""}</td>
      <td style="${td}">${e?.observations || ""}</td>
      <td style="${td};text-align:center;white-space:nowrap">${e?.start_time || ""}</td>
      <td style="${td};text-align:center;white-space:nowrap">${e?.end_time || ""}</td>
    </tr>`;
  }).join("");

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><title>Folha de Serviço</title>
<style>@page{size:A4 landscape;margin:1.5cm}body{font-family:Arial,sans-serif}
h2{text-align:center;font-size:13pt;margin:0 0 2pt 0}
.sub{text-align:center;font-size:9pt;margin:0 0 8pt 0;color:#555}
.info{margin:0 0 4pt 0;font-size:9pt}.info b{display:inline-block;width:65px}
.foot{margin-top:10pt;font-size:8pt;color:#888;text-align:right;border-top:1px solid #ccc;padding-top:3pt}
</style></head><body>
<h2>Folha de Serviço</h2>
<p class="sub">Plano de Trabalhos Semana ${sheet.week_start} a ${sheet.week_end}</p>
<p class="info"><b>Cliente:</b> ${sheet.client || "_______________________________"}</p>
<p class="info"><b>Nº Obra:</b> ${sheet.work_number || "_______________________________"}</p>
<p class="info"><b>Trabalhador:</b> ${sheet.worker?.full_name || "_______________________________"}</p>
<table style="border-collapse:collapse;width:100%">
<thead><tr>
<th style="${th}">Dia</th><th style="${th}">Trabalho a executar (Detalhar)</th><th style="${th}">Tipo de Trabalho</th><th style="${th}">Data</th><th style="${th}">Avaliação<br>(após terminar)</th><th style="${th}">Rubrica</th><th style="${th}">Observações</th><th style="${th}">Início<br>Trabalho</th><th style="${th}">Fim<br>Trabalho</th>
</tr></thead><tbody>${rows}</tbody></table>
<p class="foot">M24.V1_Folha de Serviço</p>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "application/msword",
      "Content-Disposition": `attachment; filename="Folha_${sheet.week_start}_${sheet.worker?.full_name?.replace(/\s/g,'_') || 'servico'}.doc"`,
    },
  });
}
