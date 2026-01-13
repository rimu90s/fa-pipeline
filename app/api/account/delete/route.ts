import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseService } from "@/app/_lib/supabase-server";

type Body = { password: string; confirm: string };

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function getSupabaseAnonServer(req: Request): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_* env");

  return createClient(url, anon, {
    auth: { persistSession: false },
    global: { headers: { cookie: req.headers.get("cookie") ?? "" } },
  });
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonError(400, "BAD_REQUEST", "Payload tidak valid");
  }

  if (body.confirm !== "DELETE") {
    return jsonError(422, "INVALID", "Ketik DELETE untuk konfirmasi");
  }
  if (!body.password || body.password.length < 8) {
    return jsonError(422, "INVALID", "Password minimal 8 karakter");
  }

  // 1) ambil user dari cookie session (anon server-side)
  let supabase: SupabaseClient;
  try {
    supabase = getSupabaseAnonServer(req);
  } catch {
    return jsonError(500, "INTERNAL", "Server misconfigured");
  }

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) {
    return jsonError(401, "UNAUTHORIZED", "Silakan login ulang");
  }

  const userId = userRes.user.id;
  const email = userRes.user.email;
  if (!email) return jsonError(400, "INVALID", "Email user tidak ditemukan");

  // 2) re-auth: verifikasi password (tidak boleh lanjut kalau gagal)
  const { error: reauthErr } = await supabase.auth.signInWithPassword({
    email,
    password: body.password,
  });
  if (reauthErr) {
    return jsonError(403, "FORBIDDEN", "Password salah");
  }

  // 3) service role: operasi destructive + audit + soft delete
  const svc = getSupabaseService();

  // 4) Ambil company/branch untuk audit (dari public.users)
  const prof = await svc
    .from("users")
    .select("company_id, branch_id")
    .eq("id", userId)
    .maybeSingle();

  if (prof.error || !prof.data?.company_id) {
    return jsonError(500, "INTERNAL", "Profil user tidak valid");
  }

  // 5) audit hard-fail (compliance)
  const auditInsert = await svc.from("audit_logs").insert({
    company_id: prof.data.company_id,
    branch_id: prof.data.branch_id ?? null,
    actor_user_id: userId,
    action: "ACCOUNT_DELETE",
    entity_table: "users",
    entity_id: userId,
    diff_summary: "user requested account deletion",
    metadata: { email },
  });

  if (auditInsert.error) {
    return jsonError(500, "AUDIT_FAILED", "Operation aborted for compliance");
  }

  // 6) soft delete users & user_roles
  const updUser = await svc
    .from("users")
    .update({ is_deleted: true, is_active: false })
    .eq("id", userId);

  if (updUser.error) {
    return jsonError(500, "INTERNAL", "Gagal menonaktifkan user");
  }

  const updRoles = await svc
    .from("user_roles")
    .update({ is_deleted: true })
    .eq("user_id", userId);

  if (updRoles.error) {
    return jsonError(500, "INTERNAL", "Gagal menonaktifkan role");
  }

  // 7) delete auth user (Supabase Auth Admin API)
  const del = await svc.auth.admin.deleteUser(userId);
  if (del.error) {
    return jsonError(500, "INTERNAL", "Gagal menghapus auth user");
  }

  return NextResponse.json({ data: { ok: true } });
}
