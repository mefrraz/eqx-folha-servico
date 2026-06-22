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

  console.log("[adminUpdateUser] calling updateUserById", { userId, keys: Object.keys(updateData), url: process.env.NEXT_PUBLIC_SUPABASE_URL });

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

  try {
    const { data: result, error } = await supabase.auth.admin.updateUserById(userId, updateData);
    console.log("[adminUpdateUser] RESULT", { result, error: error ? { message: error.message, status: error.status, name: error.name } : null });
    if (error) return { error: error.message + " (status: " + error.status + ")" };
  } catch (caught: any) {
    console.error("[adminUpdateUser] EXCEPTION", caught?.message || caught);
    return { error: "Exceção: " + (caught?.message || String(caught)) };
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
export async function addProject(data: { name: string; client_id?: string; location?: string }) {
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
