"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markAsReviewed(sheetId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("work_sheets")
    .update({ status: "reviewed" })
    .eq("id", sheetId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/hr/dashboard");
  return { success: true };
}
