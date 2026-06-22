// ── Shared domain types ──

export interface WorkEntry {
  id?: string;
  sheet_id?: string;
  day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
  work_description: string;
  work_type: "" | "new_installation" | "installation_continuation" | "preventive_maintenance" | "corrective_maintenance";
  date: string;
  evaluation: string;
  signature: string;
  observations: string;
  start_time: string;
  end_time: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkSheet {
  id?: string;
  worker_id: string;
  week_start: string;
  week_end: string;
  client: string;
  work_number: string;
  status: "draft" | "submitted" | "reviewed";
  notes?: string;
  project_id?: string;
  entries: WorkEntry[];
  created_at?: string;
  updated_at?: string;
  worker?: { full_name: string };
  project?: { name: string };
  work_entries?: WorkEntry[];
}

export interface Profile {
  id: string;
  full_name: string;
  role: "worker" | "admin" | "hr";
  company?: string;
  created_at?: string;
  updated_at?: string;
}

export const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  submitted: "Submetida",
  reviewed: "Validada",
};

export const DAY_LABELS: Record<string, string> = {
  monday: "2ª Feira",
  tuesday: "3ª Feira",
  wednesday: "4ª Feira",
  thursday: "5ª Feira",
  friday: "6ª Feira",
  saturday: "Sábado",
};

export const WORK_TYPE_LABELS: Record<string, string> = {
  new_installation: "Nova Instalação",
  installation_continuation: "Continuação instalação",
  preventive_maintenance: "Manutenção preventiva",
  corrective_maintenance: "Manutenção corretiva",
};
