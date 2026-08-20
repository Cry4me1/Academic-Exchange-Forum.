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

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifySuperAdminAuth();
        if (!auth) {
            return NextResponse.json({ error: "仅超级管理员(Hansszh)有权操作" }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await request.json();
        const { is_active, usage_limit, note } = body;

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (typeof is_active === "boolean") {
            updateData.is_active = is_active;
        }
        if (typeof usage_limit === "number" && usage_limit > 0) {
            updateData.usage_limit = usage_limit;
        }
        if (typeof note === "string") {
            updateData.note = note;
        }

        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from("invitation_codes")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("[Admin Invites API] Update error:", error);
            return NextResponse.json({ error: "更新邀请码失败" }, { status: 500 });
        }

        await logAdminAction({
            actionType: "update_invitation_code",
            targetType: "invitation_codes",
            targetId: id,
            details: updateData,
        });

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error: any) {
        console.error("[Admin Invites API] Patch exception:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifySuperAdminAuth();
        if (!auth) {
            return NextResponse.json({ error: "仅超级管理员(Hansszh)有权操作" }, { status: 403 });
        }

        const { id } = await context.params;
        const adminClient = createAdminClient();

        const { error } = await adminClient
            .from("invitation_codes")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("[Admin Invites API] Delete error:", error);
            return NextResponse.json({ error: "删除邀请码失败" }, { status: 500 });
        }

        await logAdminAction({
            actionType: "delete_invitation_code",
            targetType: "invitation_codes",
            targetId: id,
        });

        return NextResponse.json({ success: true, message: "删除成功" });
    } catch (error: any) {
        console.error("[Admin Invites API] Delete exception:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}
