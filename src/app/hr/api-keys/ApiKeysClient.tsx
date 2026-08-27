"use client";
import { useState } from "react";
import { createApiKey, revokeApiKey } from "@/app/hr/actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ApiKey {
  id: string;
  client_name: string;
  role: string;
  revoked: boolean;
  created_at?: string;
  last_used_at?: string;
}

export default function ApiKeysClient({ keys }: { keys: ApiKey[] }) {
  const [clientName, setClientName] = useState("");
  const [role, setRole] = useState("read");
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async () => {
    if (!clientName.trim()) { toast.error("Indique o nome do cliente."); return; }
    setSaving(true);
    const r = await createApiKey(clientName, role);
    if (r.error) toast.error(r.error);
    else { setNewKey(r.key ?? null); setClientName(""); setRole("read"); router.refresh(); }
    setSaving(false);
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revogar esta chave? O cliente deixará de conseguir aceder.")) return;
    const r = await revokeApiKey(id);
    if (r.error) toast.error(r.error);
    else { toast.success("Chave revogada."); router.refresh(); }
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-brand-dark">Criar chave</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label-field">Nome do cliente</label>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="input-field" placeholder="EX: Hermes Agent" />
          </div>
          <div>
            <label className="label-field">Permissão</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field">
              <option value="read">Leitura (só consulta)</option>
              <option value="admin">Admin/RH (pode validar)</option>
            </select>
          </div>
        </div>
        <button onClick={handleCreate} disabled={saving} className="btn-primary text-sm !px-5 !py-2.5">
          {saving ? "A criar..." : "Criar chave"}
        </button>

        {newKey && (
          <div className="rounded-xl border-2 border-brand-gold bg-brand-gold/10 p-4">
            <p className="text-xs font-semibold text-brand-soft mb-2">Guarde esta chave agora — não será mostrada novamente:</p>
            <code className="block font-mono text-sm text-brand-dark break-all bg-white rounded-lg px-3 py-2 border border-brand-light/40">{newKey}</code>
            <button onClick={() => { navigator.clipboard.writeText(newKey); toast.success("Copiada!"); }} className="text-xs font-semibold text-brand-dark hover:text-brand-gold mt-2">Copiar</button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="card">
        <h3 className="text-sm font-semibold text-brand-dark mb-3">Chaves ({keys.length})</h3>
        {keys.length === 0 ? (
          <p className="text-sm text-brand-muted py-4">Nenhuma chave criada ainda.</p>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded-xl hover:bg-brand-gold/5 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-medium text-brand-dark">{k.client_name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${k.role === "admin" ? "bg-brand-dark text-white" : "bg-brand-light/30 text-brand-soft"}`}>
                    {k.role === "admin" ? "Admin/RH" : "Leitura"}
                  </span>
                  {k.revoked && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Revogada</span>}
                </div>
                <div className="flex items-center gap-3">
                  {k.last_used_at && <span className="text-xs text-brand-muted">usada {new Date(k.last_used_at).toLocaleDateString("pt")}</span>}
                  {!k.revoked && (
                    <button onClick={() => handleRevoke(k.id)} className="text-xs text-brand-muted hover:text-red-600 transition-colors">Revogar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
