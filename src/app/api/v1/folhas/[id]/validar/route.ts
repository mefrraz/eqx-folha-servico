import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateApiKey, canWrite } from "@/lib/api-auth";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await authenticateApiKey(request);
  if (!auth) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (!canWrite(auth.role)) return NextResponse.json({ error: "Permissão insuficiente (requer admin/RH)." }, { status: 403 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("work_sheets")
    .update({ status: "reviewed" })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: "Folha validada." });
}
