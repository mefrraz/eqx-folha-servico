import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { notFound } from "next/navigation";
import EditUserForm from "./EditUserForm";
import ValidateButton from "../dashboard/ValidateButton";

export const dynamic = "force-dynamic";

const WORK_TYPE_LABELS: Record<string, string> = {
  new_installation: "Nova Instalação",
  installation_continuation: "Continuação instalação",
  preventive_maintenance: "Manutenção preventiva",
  corrective_maintenance: "Manutenção corretiva",
};

const DAY_LABELS: Record<string, string> = {
  monday: "2ª", tuesday: "3ª", wednesday: "4ª",
  thursday: "5ª", friday: "6ª", saturday: "Sáb",
};

function calcMinutes(entries: any[]): number {
  return entries.reduce((s: number, e: any) => {
    if (e.start_time && e.end_time) {
      const [sh, sm] = e.start_time.split(":").map(Number);
      const [eh, em] = e.end_time.split(":").map(Number);
      return s + (eh * 60 + em) - (sh * 60 + sm);
    }
    return s;
  }, 0);
}

function fmtMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const userId = params.id;

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) notFound();

  // Get user email from auth (we need service_role for this)
  // Use profiles data instead
  const { data: sheets } = await supabase
    .from("work_sheets")
    .select("*, work_entries(*)")
    .eq("worker_id", userId)
    .order("week_start", { ascending: false })
    .limit(50);

  const totalMins = (sheets || []).reduce((sum, s) => sum + calcMinutes(s.work_entries || []), 0);

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{profile.full_name}</h2>
          <p className="text-sm text-gray-500">ID: {userId}</p>
          <p className="text-sm text-gray-500">
            Registo: {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: pt })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800">{fmtMinutes(totalMins)}</p>
            <p className="text-xs text-gray-500">Total horas</p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <EditUserForm userId={userId} fullName={profile.full_name} />

      {/* Sheets */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Folhas de serviço ({sheets?.length || 0})
        </h3>

        {!sheets || sheets.length === 0 ? (
          <div className="card text-center py-8 text-gray-500">Nenhuma folha registada.</div>
        ) : (
          <div className="space-y-3">
            {sheets.map((sheet) => {
              const eMins = calcMinutes(sheet.work_entries || []);
              return (
                <details key={sheet.id} className="card group !p-4">
                  <summary className="cursor-pointer list-none flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">
                        Semana {format(new Date(sheet.week_start + "T00:00:00"), "dd/MM", { locale: pt })}{" "}
                        — {format(new Date(sheet.week_end + "T00:00:00"), "dd/MM/yyyy", { locale: pt })}
                      </span>
                      <span className="text-xs text-gray-500 ml-3">
                        {sheet.client || "—"} · {sheet.work_number || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{fmtMinutes(eMins)}</span>
                      <ValidateButton sheetId={sheet.id} currentStatus={sheet.status} />
                    </div>
                  </summary>
                  <table className="w-full text-xs mt-3">
                    <thead>
                      <tr className="text-gray-500 border-b">
                        <th className="text-left py-1">Dia</th>
                        <th className="text-left py-1">Trabalho</th>
                        <th className="text-left py-1">Tipo</th>
                        <th className="text-right py-1">Horas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["monday","tuesday","wednesday","thursday","friday","saturday"].map((day) => {
                        const entry = (sheet.work_entries || []).find((e: any) => e.day === day);
                        if (!entry) return null;
                        let dayMins = 0;
                        if (entry.start_time && entry.end_time) {
                          const [sh, sm] = entry.start_time.split(":").map(Number);
                          const [eh, em] = entry.end_time.split(":").map(Number);
                          dayMins = eh * 60 + em - (sh * 60 + sm);
                        }
                        return (
                          <tr key={day} className="border-b border-gray-50">
                            <td className="py-1 font-medium">{DAY_LABELS[day]}</td>
                            <td className="py-1 text-gray-600">{entry.work_description || "—"}</td>
                            <td className="py-1 text-gray-500">{WORK_TYPE_LABELS[entry.work_type] || "—"}</td>
                            <td className="py-1 text-right">{dayMins > 0 ? fmtMinutes(dayMins) : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
