import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { adminPassword } = await _req.json();

    // Verify admin password
    if (!adminPassword || adminPassword !== process.env.ADMIN_DELETE_PASSWORD) {
      return NextResponse.json({ error: "Password de admin incorreta." }, { status: 403 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete auth user (cascades to profile, work_sheets, work_entries)
    const { error } = await supabase.auth.admin.deleteUser(params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno." }, { status: 500 });
  }
}
