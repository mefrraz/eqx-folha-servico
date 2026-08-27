import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateApiKey } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get("week_start");
  const status = searchParams.get("status");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from("work_sheets")
    .select("id, worker_id, week_start, week_end, client, work_number, status, created_at, worker:profiles!work_sheets_worker_id_fkey(full_name, email)")
    .order("week_start", { ascending: false })
    .limit(200);

  if (weekStart) query = query.eq("week_start", weekStart);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ folhas: data });
}
