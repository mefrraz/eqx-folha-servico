import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify the caller is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { userId, full_name, shift_preference } = await request.json();

  // Only allow updating own profile, or if admin
  if (user.id !== userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "hr")) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }
  }

  const updates: Record<string, unknown> = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (shift_preference !== undefined) updates.shift_preference = shift_preference;

  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
