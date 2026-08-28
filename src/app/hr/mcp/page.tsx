import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function McpPage() {
  const supabase = await createClient();
  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, client_name, role, revoked")
    .order("created_at", { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eqx-folha-servico.vercel.app";
  const mcpUrl = `${appUrl}/api/mcp`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Ligar o Hermes (MCP)</h1>
        <p className="text-sm text-brand-soft mt-1">Como configurar o Hermes Agent para se ligar à plataforma de forma segura.</p>
      </div>

      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-brand-dark">1. URL do MCP</h3>
        <code className="block font-mono text-sm text-brand-dark bg-brand-gold/10 rounded-lg px-3 py-2 border border-brand-light/40 break-all">{mcpUrl}</code>
        <p className="text-xs text-brand-muted">Transporte: streamable HTTP (HTTPS). Método: POST (JSON-RPC 2.0).</p>
      </div>

      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-brand-dark">2. Autenticação</h3>
        <p className="text-sm text-brand-soft">Cada pedido leva a API key no header:</p>
        <code className="block font-mono text-xs text-brand-dark bg-brand-gold/10 rounded-lg px-3 py-2 border border-brand-light/40 break-all">Authorization: Bearer eqx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
        <p className="text-xs text-brand-muted">Cria/revoga chaves em <b>API Keys</b> no menu. A chave só é mostrada uma vez.</p>
      </div>

      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-brand-dark">3. Ferramentas disponíveis</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {[
            ["listar_trabalhadores", "leitura"],
            ["listar_folhas", "leitura"],
            ["detalhe_folha", "leitura"],
            ["listar_clientes", "leitura"],
            ["listar_obras", "leitura"],
            ["exportar_folha", "leitura"],
            ["validar_folha", "admin/RH"],
            ["criar_obra", "admin/RH"],
            ["apagar_obra", "admin/RH"],
            ["criar_cliente", "admin/RH"],
            ["apagar_cliente", "admin/RH"],
            ["apagar_trabalhador", "admin/RH"],
            ["atribuir_obra_folha", "admin/RH"],
          ].map(([tool, perm]) => (
            <div key={tool} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-brand-gold/5">
              <code className="font-mono text-xs text-brand-dark">{tool}</code>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${perm === "admin/RH" ? "bg-brand-dark text-white" : "bg-brand-light/30 text-brand-soft"}`}>{perm}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-brand-dark">4. Chaves criadas</h3>
        {keys && keys.length > 0 ? (
          <div className="space-y-1.5">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-brand-gold/5">
                <span className="text-sm text-brand-dark">{k.client_name}</span>
                <span className="text-xs text-brand-muted">{k.role === "admin" ? "Admin/RH" : "Leitura"}{k.revoked ? " · Revogada" : ""}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-brand-muted">Nenhuma chave criada. Crie uma em <b>API Keys</b>.</p>
        )}
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-brand-dark mb-2">5. Testar com curl</h3>
        <pre className="text-xs font-mono text-brand-dark bg-brand-gold/10 rounded-lg p-3 border border-brand-light/40 overflow-x-auto">{`curl -X POST ${mcpUrl} \\
  -H "Authorization: Bearer eqx_SUA_CHAVE" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}</pre>
      </div>
    </div>
  );
}
