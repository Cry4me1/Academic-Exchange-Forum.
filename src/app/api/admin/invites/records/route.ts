import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifySuperAdminAuth() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("username, email, full_name")
        .eq("id", user.id)
        .maybeSingle();

    const isHansszhUser = 
        profile?.username?.toLowerCase() === "hansszh" || 
        user.email?.toLowerCase().includes("hansszh") ||
        profile?.full_name?.toLowerCase().includes("hansszh");

    const { data: adminRole } = await supabase
        .from("admin_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

    const isAdmin = adminRole?.role === "super_admin" || adminRole?.role === "admin" || isHansszhUser;
    if (!isAdmin) return null;

    return { user, role: adminRole?.role || "super_admin", username: profile?.username || "Hansszh" };
}

export async function GET(request: NextRequest) {
    try {
        const auth = await verifySuperAdminAuth();
        if (!auth) {
            return NextResponse.json({ error: "仅超级管理员(Hansszh)有权查看核销审计日志" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") || "20")));
        const search = searchParams.get("search") || "";

        const adminClient = createAdminClient();

        let query = adminClient
            .from("invitation_records")
            .select(`
                id,
                code,
                code_id,
                invitee_username,
                invitee_email,
                ip_address,
                used_at,
                inviter:inviter_id (
                    id,
                    username,
                    full_name,
                    avatar_url
                ),
                invitee:invitee_id (
                    id,
                    username,
                    full_name,
                    avatar_url
                )
            `, { count: "exact" });

        if (search) {
            query = query.or(`code.ilike.%${search}%,invitee_username.ilike.%${search}%,invitee_email.ilike.%${search}%`);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: records, count, error } = await query
            .order("used_at", { ascending: false })
            .range(from, to);

        if (error) {
            console.error("[Admin Invites Records API] Query error:", error);
            return NextResponse.json({ error: "查询核销记录失败" }, { status: 500 });
        }

        return NextResponse.json({
            records: records || [],
            total: count || 0,
            page,
            pageSize,
        });

    } catch (error: any) {
        console.error("[Admin Invites Records API] Exception:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}
