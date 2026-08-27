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
    description: "Lista todos os trabalhadores (nome, email, data de registo).",
    inputSchema: { type: "object", properties: {} },
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
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .eq("role", "worker")
        .order("full_name");
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ trabalhadores: data });
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
