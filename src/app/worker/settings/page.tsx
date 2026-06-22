import { createClient } from "@/lib/supabase/server";
import WorkerSettingsClient from "./WorkerSettingsClient";

export const dynamic = "force-dynamic";

function calcM(e: any[]) {
  return e.reduce((s: number, x: any) => {
    if (x.start_time && x.end_time) { const [a, b] = x.start_time.split(":").map(Number); const [c, d] = x.end_time.split(":").map(Number); return s + (c * 60 + d) - (a * 60 + b); }
    return s;
  }, 0);
}

export default async function WorkerSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: sheets } = await supabase.from("work_sheets").select("work_entries(*)").eq("worker_id", user.id);
  const { data: projects } = await supabase.from("work_sheets").select("project_id, project:projects(name, client:clients(name))").eq("worker_id", user.id).limit(100);

  const totalMins = (sheets || []).reduce((s, sh) => s + calcM(sh.work_entries || []), 0);
  const uniqueProjects = Array.from(new Map((projects || []).filter(p => p.project).map(p => [p.project_id, p.project])).values());

  return (
    <WorkerSettingsClient
      userId={user.id}
      profile={profile}
      totalMins={totalMins}
      sheetsCount={sheets?.length || 0}
      projects={uniqueProjects as any[]}
    />
  );
}
