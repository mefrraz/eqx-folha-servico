"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function markAsReviewed(sheetId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("work_sheets").update({ status: "reviewed" }).eq("id", sheetId);
  if (error) return { error: error.message };
  revalidatePath("/hr", "layout");
  return { success: true };
}

export async function updateProfile(userId: string, data: { full_name?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(data).eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/hr", "layout");
  return { success: true };
}

export async function adminUpdateUser(userId: string, data: { email?: string; password?: string }) {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const updateData: Record<string, string> = {};
  if (data.email) updateData.email = data.email;
  if (data.password) updateData.password = data.password;

  const { error } = await supabase.auth.admin.updateUserById(userId, updateData);
  if (error) return { error: error.message };
  revalidatePath("/hr", "layout");
  return { success: true };
}
