import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const { code } = await request.json();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, fall back to the env-var invite code.
  if (!supabaseUrl || !anonKey) {
    const expected = process.env.INVITE_CODE;
    if (!expected) return NextResponse.json({ valid: false, disabled: true });
    return NextResponse.json({ valid: typeof code === "string" && code.trim() === expected });
  }

  const supabase = createClient(supabaseUrl, anonKey);
  const normalized = (code || "").trim().toUpperCase();

  const { data, error } = await supabase
    .from("invites")
    .select("id, code, expires_at, used_at, role, requires_approval, project_ids")
    .eq("code", normalized)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ valid: false });
  }

  // Already used
  if (data.used_at) {
    return NextResponse.json({ valid: false, reason: "used" });
  }

  // Expired
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  return NextResponse.json({ valid: true, inviteId: data.id, role: data.role, requiresApproval: data.requires_approval, projectIds: data.project_ids || [] });
}
