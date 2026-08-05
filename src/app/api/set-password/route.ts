import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Rate limit: 5 requests per minute per IP
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rl = checkRateLimit(`set-password:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: "Token e password são obrigatórios." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look up the invite token
    const { data: invite, error: inviteError } = await supabase
      .from("invite_tokens")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Token inválido ou já utilizado." }, { status: 400 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Este convite expirou. Contacte o administrador." }, { status: 400 });
    }

    // Find the user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      return NextResponse.json({ error: "Erro ao procurar utilizador." }, { status: 500 });
    }

    const targetUser = userData.users.find((u: any) => u.email === invite.email);
    if (!targetUser) {
      return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 400 });
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      { password }
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Mark token as used
    await supabase
      .from("invite_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invite.id);

    // Mark user as onboarded
    await supabase
      .from("profiles")
      .update({ onboarded: true })
      .eq("id", targetUser.id);

    return NextResponse.json({ success: true, email: invite.email });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno." }, { status: 500 });
  }
}
