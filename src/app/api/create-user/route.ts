import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, password } = body;

    if (!full_name || !email || !password) {
      return NextResponse.json({ error: "Campos obrigatórios em falta." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create auth user
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Profile is auto-created by trigger
    // Update with full_name just to be sure
    if (userData.user) {
      await supabase.from("profiles").update({ full_name }).eq("id", userData.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno." }, { status: 500 });
  }
}
