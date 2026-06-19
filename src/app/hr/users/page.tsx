import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";

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

export default async function UsersPage() {
  const supabase = await createClient();

  const { data: workers } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("role", "worker")
    .order("full_name");

  // Get latest sheet for each worker
  const { data: latestSheets } = await supabase
    .from("work_sheets")
    .select("worker_id, week_start, work_entries(*)")
    .order("week_start", { ascending: false })
    .limit(500);

  const latestByWorker = new Map<string, any>();
  for (const s of latestSheets || []) {
    if (!latestByWorker.has(s.worker_id)) {
      latestByWorker.set(s.worker_id, s);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Utilizadores</h2>

      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden sm:table-cell">Última folha</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden md:table-cell">Horas (última)</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden md:table-cell">Registo</th>
            </tr>
          </thead>
          <tbody>
            {(workers || []).map((w) => {
              const latest = latestByWorker.get(w.id);
              const mins = calcMinutes(latest?.work_entries || []);
              return (
                <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Link href={`/hr/users/${w.id}`} className="text-primary-700 hover:underline font-medium">
                      {w.full_name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-600 hidden sm:table-cell">
                    {latest
                      ? format(new Date(latest.week_start + "T00:00:00"), "dd/MM/yyyy", { locale: pt })
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                    {latest ? fmtMinutes(mins) : "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs hidden md:table-cell">
                    {format(new Date(w.created_at), "dd/MM/yyyy", { locale: pt })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(!workers || workers.length === 0) && (
          <div className="text-center py-12 text-gray-500">Nenhum utilizador registado.</div>
        )}
      </div>
    </div>
  );
}
