import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: sheet } = await supabase.from("work_sheets").select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name)").eq("id", params.id).single();
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const DL: Record<string, string> = { monday: "2ª feira", tuesday: "3ª feira", wednesday: "4ª feira", thursday: "5ª feira", friday: "6ª feira", saturday: "Sábado" };
  const WT: Record<string, string> = { new_installation: "Nova Instalação", installation_continuation: "Continuação instalação", preventive_maintenance: "Manutenção preventiva", corrective_maintenance: "Manutenção corretiva" };

  const rows = ["monday","tuesday","wednesday","thursday","friday","saturday"].map(day => {
    const e = (sheet.work_entries || []).find((x: any) => x.day === day);
    return `<tr>
      <td style="border:1px solid #999;padding:5px 8px;font-size:11px;font-family:Arial;font-weight:bold;vertical-align:top">${DL[day]}</td>
      <td style="border:1px solid #999;padding:5px 8px;font-size:11px;font-family:Arial;vertical-align:top">${e?.work_description || "&nbsp;"}</td>
      <td style="border:1px solid #999;padding:5px 8px;font-size:11px;font-family:Arial;vertical-align:top">${WT[e?.work_type] || "&nbsp;"}</td>
      <td style="border:1px solid #999;padding:5px 8px;font-size:11px;font-family:Arial;vertical-align:top">${e?.date || "&nbsp;"}</td>
      <td style="border:1px solid #999;padding:5px 8px;font-size:11px;font-family:Arial;vertical-align:top">${e?.evaluation || "&nbsp;"}</td>
      <td style="border:1px solid #999;padding:5px 8px;font-size:11px;font-family:Arial;vertical-align:top">${e?.signature || "&nbsp;"}</td>
      <td style="border:1px solid #999;padding:5px 8px;font-size:11px;font-family:Arial;vertical-align:top">${e?.observations || "&nbsp;"}</td>
    </tr>`;
  }).join("");

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><title>Folha de Serviço</title>
<style>
  @page { size: A4 landscape; margin: 2cm; }
  body { font-family: Arial, sans-serif; font-size: 11pt; }
  h2 { text-align: center; font-size: 14pt; margin-bottom: 4pt; }
  .subtitle { text-align: center; font-size: 10pt; margin-bottom: 12pt; color: #555; }
  .info { margin-bottom: 10pt; font-size: 10pt; }
  .info strong { display: inline-block; width: 70px; }
  .footer { margin-top: 14pt; font-size: 9pt; color: #888; text-align: right; border-top: 1px solid #ccc; padding-top: 4pt; }
</style>
</head>
<body>
<h2>Folha de Serviço</h2>
<p class="subtitle">Plano de Trabalhos Semana ${sheet.week_start} a ${sheet.week_end}</p>

<p class="info"><strong>Cliente:</strong> ${sheet.client || "_______________________________"}</p>
<p class="info"><strong>Nº Obra:</strong> ${sheet.work_number || "_______________________________"}</p>
<p class="info"><strong>Trabalhador:</strong> ${sheet.worker?.full_name || "_______________________________"}</p>

<table style="border-collapse:collapse;width:100%;font-size:10pt;font-family:Arial">
<thead>
<tr style="background:#e8e8e8">
<th style="border:1px solid #999;padding:5px 8px;font-size:10px;text-align:left">Dia</th>
<th style="border:1px solid #999;padding:5px 8px;font-size:10px;text-align:left">Trabalho a executar (Detalhar)</th>
<th style="border:1px solid #999;padding:5px 8px;font-size:10px;text-align:left">Tipo de Trabalho</th>
<th style="border:1px solid #999;padding:5px 8px;font-size:10px;text-align:left">Data</th>
<th style="border:1px solid #999;padding:5px 8px;font-size:10px;text-align:left">Avaliação (após terminar trabalho)</th>
<th style="border:1px solid #999;padding:5px 8px;font-size:10px;text-align:left">Rubrica</th>
<th style="border:1px solid #999;padding:5px 8px;font-size:10px;text-align:left">Observações</th>
</tr>
</thead>
<tbody>${rows}</tbody>
</table>

<p class="footer">M24.V1_Folha de Serviço</p>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "application/msword",
      "Content-Disposition": `attachment; filename="Folha_${sheet.week_start}_${sheet.worker?.full_name?.replace(/\s/g,'_') || 'servico'}.doc"`,
    },
  });
}
