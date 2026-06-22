"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { calcMinutes, formatMinutes } from "@/lib/utils";

export default function UsersPageClient() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase.from("profiles").select("id,full_name,created_at").eq("role","worker").order("full_name").then(({data}) => setWorkers(data||[]));
    // Fetch latest sheets per worker (limit to avoid over-fetching; add server-side pagination for production)
    supabase.from("work_sheets").select("worker_id,week_start,work_entries(*),project_id").order("week_start",{ascending:false}).limit(500).then(({data}) => setSheets(data||[]));
    supabase.from("projects").select("id,name").order("name").then(({data}) => setProjects(data||[]));
  }, []);

  const latestByWorker = new Map<string,any>();
  for(const s of sheets){if(!latestByWorker.has(s.worker_id))latestByWorker.set(s.worker_id,s);}

  // Worker project mapping
  const workerProjects = new Map<string,string>();
  for(const s of sheets) {
    if(s.project_id && !workerProjects.has(s.worker_id)) workerProjects.set(s.worker_id, s.project_id);
  }

  let filtered = workers;
  if(search) filtered = filtered.filter(w => w.full_name.toLowerCase().includes(search.toLowerCase()));
  if(filterProject) filtered = filtered.filter(w => workerProjects.get(w.id) === filterProject);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h2 className="text-lg font-bold text-brand-dark">Utilizadores</h2><p className="text-sm text-brand-soft mt-0.5">{workers.length} trabalhadores</p></div>
        <Link href="/auth/signup" className="btn-primary text-sm !py-2 !px-4">Adicionar</Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-field flex-1" placeholder="Pesquisar por nome..." />
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="input-field sm:w-48">
          <option value="">Todas as obras</option>
          {projects.map((p: any) => (<option key={p.id} value={p.id}>{p.name}</option>))}
        </select>
      </div>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <thead><tr className="border-b border-brand-light/30 bg-brand-gold/5"><th className="text-left py-3 px-4 font-semibold text-brand-dark text-xs tracking-wide">Nome</th><th className="text-left py-3 px-4 font-semibold text-brand-dark text-xs tracking-wide hidden sm:table-cell">Última folha</th><th className="text-left py-3 px-4 font-semibold text-brand-dark text-xs tracking-wide hidden md:table-cell">Horas</th><th className="text-left py-3 px-4 font-semibold text-brand-dark text-xs tracking-wide hidden lg:table-cell">Registo</th></tr></thead>
          <tbody>{filtered.map(w=>{const l=latestByWorker.get(w.id);const m=calcMinutes(l?.work_entries||[]);return(<tr key={w.id} className="border-b border-brand-light/20 hover:bg-brand-gold/5 transition-colors"><td className="py-3 px-4"><Link href={`/hr/users/${w.id}`} className="text-brand-dark hover:text-brand-gold font-medium">{w.full_name}</Link></td><td className="py-3 px-4 text-brand-soft hidden sm:table-cell font-mono text-xs">{l?format(new Date(l.week_start+"T00:00:00"),"dd/MM/yy",{locale:pt}):"—"}</td><td className="py-3 px-4 text-brand-dark hidden md:table-cell font-mono text-xs">{l?formatMinutes(m):"—"}</td><td className="py-3 px-4 text-brand-muted hidden lg:table-cell text-xs font-mono">{format(new Date(w.created_at),"dd/MM/yy",{locale:pt})}</td></tr>);})}</tbody>
        </table>
        {filtered.length===0 && <div className="text-center py-12 text-brand-muted text-sm">Nenhum resultado.</div>}
      </div>
    </div>
  );
}
