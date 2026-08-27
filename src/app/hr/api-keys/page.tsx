import { createClient } from "@/lib/supabase/server";
import ApiKeysClient from "./ApiKeysClient";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const supabase = await createClient();
  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, client_name, role, revoked, created_at, last_used_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">API Keys (MCP)</h1>
        <p className="text-sm text-brand-soft mt-1">
          Chaves de acesso para o Hermes Agent e outros clientes se ligarem à API/MCP. A chave só é mostrada uma vez ao criar.
        </p>
      </div>
      <ApiKeysClient keys={(keys || []) as any[]} />
    </div>
  );
}
