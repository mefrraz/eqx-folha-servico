"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// ── Sheet actions ──
export async function markAsReviewed(sheetId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("work_sheets").update({ status: "reviewed" }).eq("id", sheetId);
  if (error) return { error: error.message };
  revalidatePath("/hr", "layout");
  return { success: true };
}

export async function updateProfile(userId: string, data: { full_name?: string; company?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(data).eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/hr", "layout");
  return { success: true };
}

export async function adminUpdateUser(userId: string, data: { email?: string; password?: string }) {
  console.log("[adminUpdateUser] CALLED", { userId, hasEmail: !!data.email, hasPassword: !!data.password, passwordLen: data.password?.length });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error("[adminUpdateUser] MISSING SUPABASE_SERVICE_ROLE_KEY");
    return { error: "SUPABASE_SERVICE_ROLE_KEY não configurada. Vercel → Settings → Environment Variables." };
  }

  const updateData: Record<string, string> = {};
  if (data.email) { updateData.email = data.email; console.log("[adminUpdateUser] updating email to:", data.email); }
  if (data.password && data.password.length >= 6) { updateData.password = data.password; console.log("[adminUpdateUser] updating password (len=" + data.password.length + ")"); }

  if (Object.keys(updateData).length === 0) {
    console.warn("[adminUpdateUser] nothing to update");
    return { success: true, skipped: true };
  }

  console.log("[adminUpdateUser] calling Supabase Admin API", { userId, keys: Object.keys(updateData) });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const apiUrl = `${supabaseUrl}/auth/v1/admin/users/${userId}`;
    
    // Always include email_confirm to prevent issues
    const body = { ...updateData, email_confirm: true };
    
    console.log("[adminUpdateUser] PUT", apiUrl, "body keys:", Object.keys(body));
    
    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    let result: any = null;
    try { result = JSON.parse(rawText); } catch { /* not JSON */ }
    console.log("[adminUpdateUser] HTTP", response.status, "raw:", rawText.substring(0, 200));

    if (!response.ok) {
      return { error: `HTTP ${response.status}: ${result?.msg || result?.message || response.statusText}` };
    }

    console.log("[adminUpdateUser] SUCCESS", result);
  } catch (caught: any) {
    console.error("[adminUpdateUser] FETCH EXCEPTION", { message: caught?.message, name: caught?.name });
    return { error: "Erro de rede: " + (caught?.message || String(caught)) };
  }

  revalidatePath("/hr", "layout");
  return { success: true };
}

// ── Client actions ──
export async function addClient(clientData: { name: string; logo_url?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").insert(clientData);
  if (error) return { error: error.message };
  revalidatePath("/hr/clients");
  return { success: true };
}

export async function updateClient(id: string, data: { name?: string; logo_url?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/hr/clients", "layout");
  return { success: true };
}

// ── Project actions ──
export async function addProject(data: { name: string; number?: string; client_id?: string; location?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert(data);
  if (error) return { error: error.message };
  revalidatePath("/hr/projects");
  return { success: true };
}

export async function updateProject(id: string, data: { name?: string; client_id?: string; location?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/hr/projects", "layout");
  return { success: true };
}
