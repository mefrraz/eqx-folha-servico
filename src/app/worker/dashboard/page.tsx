import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";

const WORK_TYPE_LABELS: Record<string, string> = {
  new_installation: "Nova Instalação",
  installation_continuation: "Continuação instalação",
  preventive_maintenance: "Manutenção preventiva",
  corrective_maintenance: "Manutenção corretiva",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-yellow-100 text-yellow-800" },
  submitted: { label: "Submetida", color: "bg-green-100 text-green-800" },
  reviewed: { label: "Validada", color: "bg-blue-100 text-blue-800" },
};

export default async function WorkerDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sheets } = await supabase
    .from("work_sheets")
    .select("*, work_entries(*)")
    .eq("worker_id", user!.id)
    .order("week_start", { ascending: false })
    .limit(20);

  // Current week range
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday → we use Saturday

  const currentWeekSheet = sheets?.find(
    (s) => s.week_start === format(weekStart, "yyyy-MM-dd")
  );

  return (
    <div className="space-y-8">
      {/* Current week CTA */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Semana de {format(weekStart, "dd/MM", { locale: pt })} a{" "}
              {format(addDays(weekStart, 5), "dd/MM/yyyy", { locale: pt })}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {currentWeekSheet
                ? `Folha ${STATUS_LABELS[currentWeekSheet.status]?.label || currentWeekSheet.status}`
                : "Ainda não submeteu a folha desta semana."}
            </p>
          </div>
          {currentWeekSheet ? (
            <Link
              href={`/worker/sheet/${currentWeekSheet.id}`}
              className="btn-primary"
            >
              Editar folha atual
            </Link>
          ) : (
            <Link href="/worker/sheet/new" className="btn-primary">
              Nova folha de serviço
            </Link>
          )}
        </div>
      </div>

      {/* Past sheets */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Folhas anteriores
        </h2>

        {!sheets || sheets.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            Nenhuma folha de serviço registada.
          </div>
        ) : (
          <div className="grid gap-3">
            {sheets.map((sheet) => {
              const totalMinutes = sheet.work_entries?.reduce(
                (sum: number, e: any) => {
                  if (e.start_time && e.end_time) {
                    const [sh, sm] = e.start_time.split(":");
                    const [eh, em] = e.end_time.split(":");
                    return sum + (parseInt(eh) * 60 + parseInt(em)) - (parseInt(sh) * 60 + parseInt(sm));
                  }
                  return sum;
                },
                0
              ) || 0;
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;

              return (
                <Link
                  key={sheet.id}
                  href={`/worker/sheet/${sheet.id}`}
                  className="card hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Semana {format(new Date(sheet.week_start + "T00:00:00"), "dd/MM", { locale: pt })} —{" "}
                      {format(new Date(sheet.week_end + "T00:00:00"), "dd/MM/yyyy", { locale: pt })}
                    </p>
                    <p className="text-sm text-gray-500">
                      Cliente: {sheet.client || "—"} · Obra: {sheet.work_number || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 font-medium">
                      {hours}h{minutes > 0 ? `${minutes}m` : ""}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_LABELS[sheet.status]?.color
                      }`}
                    >
                      {STATUS_LABELS[sheet.status]?.label || sheet.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
