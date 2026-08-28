import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateApiKey, canWrite } from "@/lib/api-auth";

const SERVER_NAME = "eqx-folha-servico-mcp";
const SERVER_VERSION = "1.0.0";
const PROTOCOL_VERSION = "2024-11-05";

// ── Definição das ferramentas (tipadas) ──
const TOOLS = [
  {
    name: "listar_trabalhadores",
    description: "Lista os perfis (trabalhadores, admin e RH). Sem filtro lista todos; usa role para filtrar.",
    inputSchema: {
      type: "object",
      properties: {
        role: { type: "string", enum: ["worker", "admin", "hr"], description: "Filtrar por role. Opcional — sem filtro lista todos os perfis." },
      },
    },
  },
  {
    name: "listar_folhas",
    description: "Lista folhas de serviço, com filtro opcional por semana (week_start, formato YYYY-MM-DD) e estado (draft/submitted/reviewed).",
    inputSchema: {
      type: "object",
      properties: {
        week_start: { type: "string", description: "Segunda-feira da semana (YYYY-MM-DD). Opcional." },
        status: { type: "string", enum: ["draft", "submitted", "reviewed"], description: "Estado da folha. Opcional." },
      },
    },
  },
  {
    name: "detalhe_folha",
    description: "Devolve o detalhe completo de uma folha (entradas diárias, turnos, horas).",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "ID da folha (UUID)." } },
      required: ["id"],
    },
  },
  {
    name: "listar_clientes",
    description: "Lista todos os clientes.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "listar_obras",
    description: "Lista todas as obras (projetos) com cliente associado.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "validar_folha",
    description: "Marca uma folha como validada (reviewed). Requer permissão admin/RH.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "ID da folha (UUID)." } },
      required: ["id"],
    },
  },
  {
    name: "exportar_folha",
    description: "Exporta uma folha como documento Word (.doc). Devolve o conteúdo HTML do documento.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "ID da folha (UUID)." } },
      required: ["id"],
    },
  },
  {
    name: "criar_obra",
    description: "Cria uma obra (projeto). Requer permissão admin/RH.",
    inputSchema: {
      type: "object",
      properties: { nome: { type: "string", description: "Nome da obra." } },
      required: ["nome"],
    },
  },
  {
    name: "apagar_obra",
    description: "Apaga uma obra (projeto). Requer permissão admin/RH.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "ID da obra (UUID)." } },
      required: ["id"],
    },
  },
  {
    name: "criar_cliente",
    description: "Cria um cliente. Requer permissão admin/RH.",
    inputSchema: {
      type: "object",
      properties: { nome: { type: "string", description: "Nome do cliente." } },
      required: ["nome"],
    },
  },
  {
    name: "apagar_cliente",
    description: "Apaga um cliente. Requer permissão admin/RH.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "ID do cliente (UUID)." } },
      required: ["id"],
    },
  },
  {
    name: "apagar_trabalhador",
    description: "Apaga um trabalhador (conta). Requer permissão admin/RH.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "ID do trabalhador (UUID)." } },
      required: ["id"],
    },
  },
  {
    name: "atribuir_obra_folha",
    description: "Atribui obra/cliente a uma folha de serviço. Requer permissão admin/RH.",
    inputSchema: {
      type: "object",
      properties: {
        folha_id: { type: "string", description: "ID da folha (UUID)." },
        obra_id: { type: "string", description: "ID da obra (UUID)." },
        work_number: { type: "string", description: "Nº da obra. Opcional." },
      },
      required: ["folha_id", "obra_id"],
    },
  },
  {
    name: "apagar_trabalhadores_em_massa",
    description: "Apaga vários trabalhadores de uma vez (uma só chamada). Requer permissão admin/RH.",
    inputSchema: {
      type: "object",
      properties: {
        ids: { type: "array", items: { type: "string" }, description: "Lista de IDs (UUID) dos trabalhadores a apagar." },
      },
      required: ["ids"],
    },
  },
  {
    name: "criar_obras_em_massa",
    description: "Cria várias obras de uma vez (uma só chamada). Requer permissão admin/RH.",
    inputSchema: {
      type: "object",
      properties: {
        nomes: { type: "array", items: { type: "string" }, description: "Lista de nomes das obras a criar." },
      },
      required: ["nomes"],
    },
  },
  {
    name: "atribuir_obra_trabalhador",
    description: "Atribui uma obra a um trabalhador (aprovada de imediato). Requer permissão admin/RH.",
    inputSchema: {
      type: "object",
      properties: {
        trabalhador_id: { type: "string", description: "ID do trabalhador (UUID)." },
        obra_id: { type: "string", description: "ID da obra (UUID)." },
      },
      required: ["trabalhador_id", "obra_id"],
    },
  },
  {
    name: "resumo_semana",
    description: "Resumo de uma semana: quem submeteu, horas por trabalhador e quem está em falta. Sem chamadas extra.",
    inputSchema: {
      type: "object",
      properties: {
        week_start: { type: "string", description: "Segunda-feira da semana (YYYY-MM-DD). Opcional — por defeito usa a semana atual." },
      },
    },
  },
];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Execução das ferramentas ──
async function callTool(name: string, args: any, role: "read" | "admin"): Promise<string> {
  const supabase = getSupabase();

  switch (name) {
    case "listar_trabalhadores": {
      let query = supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .order("full_name");
      if (args?.role) query = query.eq("role", args.role);
      const { data, error } = await query;
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ perfis: data });
    }
    case "listar_folhas": {
      let query = supabase
        .from("work_sheets")
        .select("id, worker_id, week_start, week_end, client, work_number, status, created_at, worker:profiles!work_sheets_worker_id_fkey(full_name, email)")
        .order("week_start", { ascending: false })
        .limit(200);
      if (args?.week_start) query = query.eq("week_start", args.week_start);
      if (args?.status) query = query.eq("status", args.status);
      const { data, error } = await query;
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ folhas: data });
    }
    case "detalhe_folha": {
      const { data, error } = await supabase
        .from("work_sheets")
        .select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name, email)")
        .eq("id", args.id)
        .single();
      if (error || !data) return JSON.stringify({ error: "Folha não encontrada." });
      return JSON.stringify({ folha: data });
    }
    case "listar_clientes": {
      const { data, error } = await supabase.from("clients").select("id, name, logo_url, created_at").order("name");
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ clientes: data });
    }
    case "listar_obras": {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, number, location, client_id, client:clients(name)")
        .order("name");
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ obras: data });
    }
    case "validar_folha": {
      if (!canWrite(role)) return JSON.stringify({ error: "Permissão insuficiente (requer admin/RH)." });
      const { error } = await supabase.from("work_sheets").update({ status: "reviewed" }).eq("id", args.id);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, message: "Folha validada." });
    }
    case "exportar_folha": {
      const { data: sheet } = await supabase
        .from("work_sheets")
        .select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name)")
        .eq("id", args.id)
        .single();
      if (!sheet) return JSON.stringify({ error: "Folha não encontrada." });
      return JSON.stringify({
        success: true,
        filename: `Folha_${sheet.week_start}_${sheet.worker?.full_name?.replace(/\s/g, "_") || "servico"}.doc`,
        week_start: sheet.week_start,
        week_end: sheet.week_end,
        client: sheet.client,
        work_number: sheet.work_number,
        worker: sheet.worker?.full_name,
        entries: sheet.work_entries,
      });
    }
    // ── Ferramentas de escrita (requerem admin/RH) ──
    case "criar_obra": {
      if (!canWrite(role)) return JSON.stringify({ error: "Permissão insuficiente (requer admin/RH)." });
      if (!args?.nome?.trim()) return JSON.stringify({ error: "Nome da obra é obrigatório." });
      const { data, error } = await supabase.from("projects").insert({ name: args.nome.trim() }).select("id, name").maybeSingle();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, obra: data });
    }
    case "apagar_obra": {
      if (!canWrite(role)) return JSON.stringify({ error: "Permissão insuficiente (requer admin/RH)." });
      const { error } = await supabase.from("projects").delete().eq("id", args.id);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, message: "Obra apagada." });
    }
    case "criar_cliente": {
      if (!canWrite(role)) return JSON.stringify({ error: "Permissão insuficiente (requer admin/RH)." });
      if (!args?.nome?.trim()) return JSON.stringify({ error: "Nome do cliente é obrigatório." });
      const { data, error } = await supabase.from("clients").insert({ name: args.nome.trim() }).select("id, name").maybeSingle();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, cliente: data });
    }
    case "apagar_cliente": {
      if (!canWrite(role)) return JSON.stringify({ error: "Permissão insuficiente (requer admin/RH)." });
      const { error } = await supabase.from("clients").delete().eq("id", args.id);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, message: "Cliente apagado." });
    }
    case "apagar_trabalhador": {
      if (!canWrite(role)) return JSON.stringify({ error: "Permissão insuficiente (requer admin/RH)." });
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceRoleKey) return JSON.stringify({ error: "Configuração em falta." });
      const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${args.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${serviceRoleKey}`, "apikey": serviceRoleKey },
      });
      if (!res.ok) return JSON.stringify({ error: `Erro ao apagar trabalhador (HTTP ${res.status}).` });
      return JSON.stringify({ success: true, message: "Trabalhador apagado." });
    }
    case "atribuir_obra_folha": {
      if (!canWrite(role)) return JSON.stringify({ error: "Permissão insuficiente (requer admin/RH)." });
      if (!args?.folha_id || !args?.obra_id) return JSON.stringify({ error: "folha_id e obra_id são obrigatórios." });
      // Buscar a obra para obter o cliente
      const { data: obra } = await supabase
        .from("projects")
        .select("id, name, number, client:clients(name)")
        .eq("id", args.obra_id)
        .maybeSingle();
      if (!obra) return JSON.stringify({ error: "Obra não encontrada." });
      const obraClient = (obra as any).client?.name || obra.name;
      const { error } = await supabase
        .from("work_sheets")
        .update({
          project_id: obra.id,
          client: obraClient,
          work_number: args.work_number || obra.number || "",
        })
        .eq("id", args.folha_id);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, message: "Obra atribuída à folha." });
    }
    case "atribuir_obra_trabalhador": {
      if (!canWrite(role)) return JSON.stringify({ error: "Permissão insuficiente (requer admin/RH)." });
      if (!args?.trabalhador_id || !args?.obra_id) return JSON.stringify({ error: "trabalhador_id e obra_id são obrigatórios." });
      const { error } = await supabase
        .from("worker_projects")
        .upsert(
          { worker_id: args.trabalhador_id, project_id: args.obra_id, status: "approved" },
          { onConflict: "worker_id,project_id" }
        );
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, message: "Obra atribuída ao trabalhador (aprovada de imediato)." });
    }
    // ── Ferramentas em massa (requerem admin/RH) ──
    case "apagar_trabalhadores_em_massa": {
      if (!canWrite(role)) return JSON.stringify({ error: "Permissão insuficiente (requer admin/RH)." });
      const ids: string[] = Array.isArray(args?.ids) ? args.ids.map(String) : [];
      if (ids.length === 0) return JSON.stringify({ error: "Lista de ids vazia." });
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceRoleKey) return JSON.stringify({ error: "Configuração em falta." });
      let apagados = 0, falhados = 0;
      for (const id of ids) {
        try {
          const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${serviceRoleKey}`, "apikey": serviceRoleKey },
          });
          if (res.ok) apagados++; else falhados++;
        } catch { falhados++; }
      }
      return JSON.stringify({ success: true, apagados, falhados, total: ids.length });
    }
    case "criar_obras_em_massa": {
      if (!canWrite(role)) return JSON.stringify({ error: "Permissão insuficiente (requer admin/RH)." });
      const nomes: string[] = (Array.isArray(args?.nomes) ? args.nomes : [])
        .map((n: any) => String(n).trim())
        .filter(Boolean);
      if (nomes.length === 0) return JSON.stringify({ error: "Lista de nomes vazia." });
      const { data, error } = await supabase.from("projects").insert(nomes.map((n) => ({ name: n }))).select("id, name");
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, criadas: data?.length || 0, obras: data });
    }
    case "resumo_semana": {
      // Segunda-feira da semana atual (ou a passada em args)
      const now = new Date();
      const day = (now.getDay() + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - day);
      const ws = args?.week_start || monday.toISOString().slice(0, 10);
      const { data: workers } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "worker")
        .order("full_name");
      const { data: sheets } = await supabase
        .from("work_sheets")
        .select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name)")
        .eq("week_start", ws);
      const hoursByWorker = new Map<string, { nome: string; horas: string; status: string }>();
      for (const s of sheets || []) {
        let m = 0;
        for (const e of s.work_entries || []) {
          if (e.start_time && e.end_time) {
            const [sh, sm] = e.start_time.split(":").map(Number);
            const [eh, em] = e.end_time.split(":").map(Number);
            m += (eh * 60 + em) - (sh * 60 + sm);
          }
        }
        const h = Math.floor(m / 60), mm = m % 60;
        hoursByWorker.set(s.worker_id, {
          nome: s.worker?.full_name || "—",
          horas: mm > 0 ? `${h}h ${mm}m` : `${h}h`,
          status: s.status,
        });
      }
      const submeteram = (workers || []).filter((w) => hoursByWorker.has(w.id)).map((w) => ({ id: w.id, nome: w.full_name, ...(hoursByWorker.get(w.id) || {}) }));
      const pendentes = (workers || []).filter((w) => !hoursByWorker.has(w.id)).map((w) => ({ id: w.id, nome: w.full_name, email: w.email }));
      return JSON.stringify({
        semana: ws,
        total_trabalhadores: workers?.length || 0,
        submeteram,
        pendentes,
        resumo: `${submeteram.length}/${workers?.length || 0} submeteram`,
      });
    }
    default:
      return JSON.stringify({ error: `Ferramenta desconhecida: ${name}` });
  }
}

// ── Handler MCP (JSON-RPC sobre HTTP) ──
export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "Não autorizado." } }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido." } }, { status: 400 });
  }

  const { method, id, params } = body;

  switch (method) {
    case "initialize":
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        },
      });

    case "tools/list":
      return NextResponse.json({ jsonrpc: "2.0", id, result: { tools: TOOLS } });

    case "tools/call": {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const text = await callTool(toolName, toolArgs, auth.role);
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text }] },
      });
    }

    case "ping":
      return NextResponse.json({ jsonrpc: "2.0", id, result: {} });

    default:
      return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32601, message: `Método desconhecido: ${method}` } });
  }
}
