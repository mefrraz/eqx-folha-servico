"use client";
import { useState } from "react";
import { approveProjectRequest, rejectProjectRequest } from "@/app/hr/actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Request {
  worker_id: string;
  project_id: string;
  created_at?: string;
  worker?: { full_name?: string; email?: string } | null;
  project?: { name?: string; number?: string } | null;
}

export default function RequestsClient({ requests }: { requests: Request[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  const handle = async (workerId: string, projectId: string, action: "approve" | "reject") => {
    setBusy(`${workerId}-${projectId}`);
    const r = action === "approve"
      ? await approveProjectRequest(workerId, projectId)
      : await rejectProjectRequest(workerId, projectId);
    if (r.error) toast.error(r.error);
    else { toast.success(action === "approve" ? "Obra aprovada!" : "Pedido rejeitado."); router.refresh(); }
    setBusy(null);
  };

  if (requests.length === 0) {
    return <div className="card text-center py-10 text-brand-muted text-sm">Sem pedidos pendentes.</div>;
  }

  return (
    <div className="card space-y-2">
      {requests.map((r) => (
        <div key={`${r.worker_id}-${r.project_id}`} className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded-xl hover:bg-brand-gold/5 transition-colors">
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-dark">{r.worker?.full_name || r.worker?.email || "—"}</p>
            <p className="text-xs text-brand-soft truncate">{r.project?.name} {r.project?.number ? `(${r.project.number})` : ""}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handle(r.worker_id, r.project_id, "approve")}
              disabled={busy === `${r.worker_id}-${r.project_id}`}
              className="text-xs font-semibold bg-success/20 text-green-700 px-3 py-1.5 rounded-lg hover:brightness-95 transition-all disabled:opacity-50"
            >
              Aprovar
            </button>
            <button
              onClick={() => handle(r.worker_id, r.project_id, "reject")}
              disabled={busy === `${r.worker_id}-${r.project_id}`}
              className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:brightness-95 transition-all disabled:opacity-50"
            >
              Rejeitar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
