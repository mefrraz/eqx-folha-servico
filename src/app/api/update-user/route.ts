import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Verify the caller is an admin
    const serverClient = await createServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: profile } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "hr")) {
      return NextResponse.json({ error: "Apenas administradores." }, { status: 403 });
    }

    const body = await request.json();
    const { userId, email, password } = body;

    if (!userId) return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });

    // Only update email if it changed AND is not empty
    const hasEmail = email && typeof email === "string" && email.includes("@");
    const hasPassword = password && typeof password === "string" && password.length >= 6;

    if (!hasEmail && !hasPassword) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updateData: { email?: string; password?: string } = {};
    if (hasEmail) updateData.email = email;
    if (hasPassword) updateData.password = password;

    const { error } = await supabase.auth.admin.updateUserById(userId, updateData);
    if (error) {
      // "same as old" is not a real error
      if (error.message?.includes("same as old") || error.message?.includes("different")) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("update-user error:", err);
    return NextResponse.json({ error: err?.message || "Erro interno" }, { status: 500 });
  }
}
