import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateApiKey } from "@/lib/api-auth";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await authenticateApiKey(request);
  if (!auth) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: sheet, error } = await supabase
    .from("work_sheets")
    .select("*, work_entries(*), worker:profiles!work_sheets_worker_id_fkey(full_name, email)")
    .eq("id", params.id)
    .single();

  if (error || !sheet) return NextResponse.json({ error: "Folha não encontrada." }, { status: 404 });

  return NextResponse.json({ folha: sheet });
}
