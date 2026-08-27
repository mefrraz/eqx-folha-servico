import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export interface ApiKeyAuth {
  role: "read" | "admin";
}

/**
 * Autentica um pedido por API key (bearer token).
 * A chave é guardada em hash SHA-256 na tabela api_keys.
 * Devolve o role da chave, ou null se inválida/revogada.
 */
export async function authenticateApiKey(request: Request): Promise<ApiKeyAuth | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const key = authHeader.slice(7).trim();
  if (!key) return null;

  const hash = crypto.createHash("sha256").update(key).digest("hex");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data } = await supabase
    .from("api_keys")
    .select("role, revoked")
    .eq("key_hash", hash)
    .maybeSingle();

  if (!data || data.revoked) return null;

  // Atualizar last_used_at (não bloqueia o pedido)
  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("key_hash", hash);

  return { role: data.role as "read" | "admin" };
}

/** Verifica se o role tem permissão de escrita (admin/RH). */
export function canWrite(role: "read" | "admin"): boolean {
  return role === "admin";
}
