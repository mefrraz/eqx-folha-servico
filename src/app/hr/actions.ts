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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return { error: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor. Contacta o admin." };
  }
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );
  const updateData: Record<string, string> = {};
  if (data.email) updateData.email = data.email;
  if (data.password) updateData.password = data.password;
  const { error } = await supabase.auth.admin.updateUserById(userId, updateData);
  if (error) return { error: error.message };
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
