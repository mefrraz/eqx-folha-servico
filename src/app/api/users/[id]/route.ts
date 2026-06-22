import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { email, password } = await _req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e password obrigatórios." }, { status: 400 });
    }

    // Use a regular client (anon key) for sign-in — service_role cannot sign in users
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Credenciais de admin inválidas." }, { status: 403 });
    }

    // Verify the authenticated user is an admin using the same client
    const { data: adminProfile } = await authClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (!adminProfile || (adminProfile.role !== "admin" && adminProfile.role !== "hr")) {
      return NextResponse.json(
        { error: "Apenas administradores podem eliminar utilizadores." },
        { status: 403 }
      );
    }

    // Use service_role client only for the privileged operation
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await serviceClient.auth.admin.deleteUser(params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno." }, { status: 500 });
  }
}
