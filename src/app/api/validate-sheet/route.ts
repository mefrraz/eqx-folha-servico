import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { sheetId } = await request.json();
  const { error } = await supabase.from("work_sheets").update({ status: "reviewed" }).eq("id", sheetId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
