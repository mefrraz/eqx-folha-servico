import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { email, password } = await _req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e password obrigatórios." }, { status: 400 });
    }

    // Verify admin credentials via signIn
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check user is admin
    const { data: profile } = await adminClient.from("profiles").select("role").eq("id", params.id).maybeSingle();
    // Actually we need to verify the requesting admin's credentials, not the target user
    // Use a separate Supabase client without service_role for auth check
    const { data: authData, error: authError } = await adminClient.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Credenciais de admin inválidas." }, { status: 403 });
    }

    // Verify the authenticated user is an admin
    const { data: adminProfile } = await adminClient.from("profiles").select("role").eq("id", authData.user.id).single();
    if (!adminProfile || (adminProfile.role !== "admin" && adminProfile.role !== "hr")) {
      return NextResponse.json({ error: "Apenas administradores podem eliminar utilizadores." }, { status: 403 });
    }

    // Delete target user
    const { error } = await adminClient.auth.admin.deleteUser(params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno." }, { status: 500 });
  }
}
