import { createClient } from "@/lib/supabase/server";
import ReportsClient from "./ReportsClient";
import { calcMinutes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: { months?: string } }) {
  const supabase = await createClient();
  const months = parseInt(searchParams.months || "6");
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  // Fetch sheets with entries
  const { data: sheets } = await supabase
    .from("work_sheets")
    .select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name), project:projects(name)")
    .gte("week_start", cutoffStr)
    .order("week_start", { ascending: false })
    .limit(2000);

  const safe = sheets || [];

  // By project
  const byProject = new Map<string, { name: string; mins: number; sheets: number; workers: Set<string> }>();
  for (const s of safe) {
    const key = s.project?.name || s.work_number || "Sem obra";
    if (!byProject.has(key)) byProject.set(key, { name: key, mins: 0, sheets: 0, workers: new Set() });
    const p = byProject.get(key)!;
    p.mins += calcMinutes(s.work_entries || []);
    p.sheets++;
    p.workers.add(s.worker_id);
  }
  const projectData = Array.from(byProject.values()).sort((a, b) => b.mins - a.mins);
  const maxProjectMins = Math.max(...projectData.map(p => p.mins), 1);

  // By worker
  const byWorker = new Map<string, { name: string; mins: number; sheets: number }>();
  for (const s of safe) {
    const key = s.worker_id;
    if (!byWorker.has(key)) byWorker.set(key, { name: s.worker?.full_name || "—", mins: 0, sheets: 0 });
    const w = byWorker.get(key)!;
    w.mins += calcMinutes(s.work_entries || []);
    w.sheets++;
  }
  const workerData = Array.from(byWorker.values()).sort((a, b) => b.mins - a.mins);
  const maxWorkerMins = Math.max(...workerData.map(w => w.mins), 1);

  // By month
  const byMonth = new Map<string, number>();
  for (const s of safe) {
    const month = s.week_start.substring(0, 7);
    byMonth.set(month, (byMonth.get(month) || 0) + calcMinutes(s.work_entries || []));
  }
  const monthData = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const maxMonthMins = Math.max(...Array.from(byMonth.values()), 1);

  const totalMins = safe.reduce((s, sh) => s + calcMinutes(sh.work_entries || []), 0);
  const totalWorkers = new Set(safe.map(s => s.worker_id)).size;
  const totalSheets = safe.length;

  return (
    <ReportsClient
      projectData={projectData} maxProjectMins={maxProjectMins}
      workerData={workerData} maxWorkerMins={maxWorkerMins}
      monthData={monthData} maxMonthMins={maxMonthMins}
      totalMins={totalMins} totalWorkers={totalWorkers} totalSheets={totalSheets}
      months={months}
    />
  );
}
