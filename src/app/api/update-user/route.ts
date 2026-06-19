import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId, email, password } = await request.json();
  const data: Record<string, string> = {};
  if (email) data.email = email;
  if (password && password.length >= 6) data.password = password;
  if (Object.keys(data).length === 0) return NextResponse.json({ success: true, skipped: true });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await supabase.auth.admin.updateUserById(userId, data);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
