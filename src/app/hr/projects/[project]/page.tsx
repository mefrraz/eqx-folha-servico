import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ProjectDetailClient from "./ProjectDetailClient";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({ params }: { params: { project: string } }) {
  const supabase = await createClient();
  const pid = params.project;
  const { data: project } = await supabase.from("projects").select("*, client:clients(name)").eq("id", pid).single();
  if (!project) return (<div className="card text-center py-16"><p className="text-brand-muted text-sm">Obra não encontrada.</p><Link href="/hr/projects" className="btn-ghost mt-3 inline-flex">← Obras</Link></div>);
  const { data: sheets } = await supabase.from("work_sheets").select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name)").eq("project_id", pid).order("week_start",{ascending:false}).limit(500);
  return (<div className="space-y-6"><Link href="/hr/projects" className="text-xs text-brand-muted hover:text-brand-dark transition-colors">← Obras</Link><ProjectDetailClient project={project} sheets={sheets||[]} /></div>);
}
