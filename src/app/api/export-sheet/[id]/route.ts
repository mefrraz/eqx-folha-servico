import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: sheet } = await supabase.from("work_sheets").select("*, work_entries(*)").eq("id", params.id).single();
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dayLabels: Record<string, string> = { monday: "2ª Feira", tuesday: "3ª Feira", wednesday: "4ª Feira", thursday: "5ª Feira", friday: "6ª Feira", saturday: "Sábado" };
  const typeLabels: Record<string, string> = { new_installation: "Nova Instalação", installation_continuation: "Continuação instalação", preventive_maintenance: "Manutenção preventiva", corrective_maintenance: "Manutenção corretiva" };

  const rows = ["monday","tuesday","wednesday","thursday","friday","saturday"].map(day => {
    const e = (sheet.work_entries || []).find((x: any) => x.day === day);
    return `<tr>
      <td style="border:1px solid #ccc;padding:6px;font-weight:bold">${dayLabels[day]}</td>
      <td style="border:1px solid #ccc;padding:6px">${e?.work_description || ""}</td>
      <td style="border:1px solid #ccc;padding:6px">${typeLabels[e?.work_type] || ""}</td>
      <td style="border:1px solid #ccc;padding:6px">${e?.date || ""}</td>
      <td style="border:1px solid #ccc;padding:6px">${e?.start_time || ""}</td>
      <td style="border:1px solid #ccc;padding:6px">${e?.end_time || ""}</td>
      <td style="border:1px solid #ccc;padding:6px">${e?.evaluation || ""}</td>
      <td style="border:1px solid #ccc;padding:6px">${e?.signature || ""}</td>
      <td style="border:1px solid #ccc;padding:6px">${e?.observations || ""}</td>
    </tr>`;
  }).join("");

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><title>Folha de Serviço</title></head>
<body>
<h2 style="text-align:center">Folha de Serviço</h2>
<p><strong>Cliente:</strong> ${sheet.client || "________________"}</p>
<p><strong>Nº Obra:</strong> ${sheet.work_number || "________________"}</p>
<p><strong>Semana:</strong> ${sheet.week_start} a ${sheet.week_end}</p>
<table style="border-collapse:collapse;width:100%;font-size:12px;font-family:Arial">
<thead><tr style="background:#f0f0f0">
<th style="border:1px solid #ccc;padding:6px">Dia</th><th style="border:1px solid #ccc;padding:6px">Trabalho a executar</th><th style="border:1px solid #ccc;padding:6px">Tipo de Trabalho</th><th style="border:1px solid #ccc;padding:6px">Data</th><th style="border:1px solid #ccc;padding:6px">Início</th><th style="border:1px solid #ccc;padding:6px">Fim</th><th style="border:1px solid #ccc;padding:6px">Avaliação</th><th style="border:1px solid #ccc;padding:6px">Rubrica</th><th style="border:1px solid #ccc;padding:6px">Observações</th>
</tr></thead><tbody>${rows}</tbody></table>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "application/msword",
      "Content-Disposition": `attachment; filename="Folha_${sheet.week_start}.doc"`,
    },
  });
}
