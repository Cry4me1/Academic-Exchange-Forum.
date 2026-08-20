import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/permissions";

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

export async function GET() {
    try {
        const auth = await verifySuperAdminAuth();
        if (!auth) {
            return NextResponse.json({ error: "仅超级管理员(Hansszh)有权访问系统设置" }, { status: 403 });
        }

        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from("system_settings")
            .select("*");

        if (error) {
            console.error("[Admin Settings API] Query error:", error);
            return NextResponse.json({ error: "获取系统设置失败" }, { status: 500 });
        }

        const settingsMap: Record<string, any> = {};
        (data || []).forEach((row) => {
            settingsMap[row.key] = row.value;
        });

        if (!settingsMap.registration_mode) {
            settingsMap.registration_mode = "INVITE_ONLY";
        }

        return NextResponse.json({ settings: settingsMap });
    } catch (error: any) {
        console.error("[Admin Settings API] Exception:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await verifySuperAdminAuth();
        if (!auth) {
            return NextResponse.json({ error: "仅超级管理员(Hansszh)有权修改系统设置" }, { status: 403 });
        }

        const body = await request.json();
        const { key, value, description } = body;

        if (!key) {
            return NextResponse.json({ error: "缺少配置 key" }, { status: 400 });
        }

        const adminClient = createAdminClient();

        const { data, error } = await adminClient
            .from("system_settings")
            .upsert({
                key,
                value,
                description: description || undefined,
                updated_at: new Date().toISOString(),
                updated_by: auth.user.id,
            })
            .select()
            .single();

        if (error) {
            console.error("[Admin Settings API] Upsert error:", error);
            return NextResponse.json({ error: "更新系统设置失败" }, { status: 500 });
        }

        await logAdminAction({
            actionType: "update_system_setting",
            targetType: "system_settings",
            targetId: key,
            details: { key, value },
        });

        return NextResponse.json({ success: true, setting: data });
    } catch (error: any) {
        console.error("[Admin Settings API] Exception:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}
