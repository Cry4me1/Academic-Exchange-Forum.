import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInviteCodesSchema } from "@/lib/validations/auth";
import { logAdminAction } from "@/lib/admin/permissions";

// 辅助函数：校验超级管理员 (Hansszh) 权限
async function verifySuperAdminAuth() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 1. 检查 profiles 表中的用户名/邮箱
    const { data: profile } = await supabase
        .from("profiles")
        .select("username, email, full_name")
        .eq("id", user.id)
        .maybeSingle();

    const isHansszhUser = 
        profile?.username?.toLowerCase() === "hansszh" || 
        user.email?.toLowerCase().includes("hansszh") ||
        profile?.full_name?.toLowerCase().includes("hansszh");

    // 2. 检查 admin_roles 表
    const { data: adminRole } = await supabase
        .from("admin_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

    const isAdmin = adminRole?.role === "super_admin" || adminRole?.role === "admin" || isHansszhUser;

    if (!isAdmin) return null;

    return { 
        user, 
        role: adminRole?.role || "super_admin",
        username: profile?.username || "Hansszh" 
    };
}

export async function GET(request: NextRequest) {
    try {
        const auth = await verifySuperAdminAuth();
        if (!auth) {
            return NextResponse.json({ error: "仅超级管理员(Hansszh)有权访问邀请码管理中心" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") || "20")));
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "all";

        const adminClient = createAdminClient();

        // 1. 查询统计数据
        const { data: allCodes } = await adminClient
            .from("invitation_codes")
            .select("usage_limit, used_count, is_active, expires_at");

        const now = new Date();
        let totalCount = 0;
        let totalUsed = 0;
        let totalRemaining = 0;
        let activeCount = 0;

        (allCodes || []).forEach((c) => {
            totalCount++;
            totalUsed += c.used_count || 0;
            const remaining = Math.max(0, (c.usage_limit || 1) - (c.used_count || 0));
            const isExpired = c.expires_at ? new Date(c.expires_at) < now : false;
            if (c.is_active && !isExpired && remaining > 0) {
                activeCount++;
                totalRemaining += remaining;
            }
        });

        // 2. 分页查询列表
        let query = adminClient
            .from("invitation_codes")
            .select(`
                id,
                code,
                usage_limit,
                used_count,
                expires_at,
                is_active,
                note,
                created_at,
                creator:creator_id (
                    id,
                    username,
                    full_name,
                    avatar_url
                )
            `, { count: "exact" });

        if (search) {
            query = query.or(`code.ilike.%${search}%,note.ilike.%${search}%`);
        }

        if (status === "active") {
            query = query.eq("is_active", true);
        } else if (status === "disabled") {
            query = query.eq("is_active", false);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: items, count, error: listError } = await query
            .order("created_at", { ascending: false })
            .range(from, to);

        if (listError) {
            console.error("[Admin Invites API] List query error:", listError);
            return NextResponse.json({ error: "查询邀请码列表失败" }, { status: 500 });
        }

        return NextResponse.json({
            stats: {
                totalCount,
                totalUsed,
                totalRemaining,
                activeCount,
            },
            items: items || [],
            total: count || 0,
            page,
            pageSize,
        });

    } catch (error: any) {
        console.error("[Admin Invites API] Exception:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await verifySuperAdminAuth();
        if (!auth) {
            return NextResponse.json({ error: "仅超级管理员(Hansszh)有权批量签发邀请码" }, { status: 403 });
        }

        const body = await request.json();
        const parsed = generateInviteCodesSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({
                error: parsed.error.issues[0]?.message || "参数校验失败",
            }, { status: 400 });
        }

        const { prefix, count, usageLimit, validDays, note } = parsed.data;

        const expiresAt = validDays && validDays > 0 
            ? new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString()
            : null;

        const adminClient = createAdminClient();

        // 生成高熵随机码辅助函数
        const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
        const cleanPrefix = (prefix || "SCHOLAR").trim().toUpperCase();
        const finalPrefix = cleanPrefix.endsWith("-") ? cleanPrefix : `${cleanPrefix}-`;

        const newCodesToInsert = [];
        for (let i = 0; i < count; i++) {
            let randomPart = "";
            for (let r = 0; r < 8; r++) {
                if (r === 4) randomPart += "-";
                randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            newCodesToInsert.push({
                code: `${finalPrefix}${randomPart}`,
                creator_id: auth.user.id,
                usage_limit: usageLimit,
                used_count: 0,
                expires_at: expiresAt,
                is_active: true,
                note: note || "Hansszh 签发",
            });
        }

        // 直接通过 Admin Client 批量插入数据库（避免 RPC 中 auth.uid() 为 NULL 的问题）
        const { data: insertedCodes, error: insertError } = await adminClient
            .from("invitation_codes")
            .insert(newCodesToInsert)
            .select("code, usage_limit, expires_at, note");

        if (insertError) {
            console.error("[Admin Invites API] Insert codes error:", insertError);
            return NextResponse.json({ error: insertError.message || "签发邀请码失败" }, { status: 500 });
        }

        await logAdminAction({
            actionType: "batch_generate_invitation_codes",
            targetType: "invitation_codes",
            details: {
                count,
                prefix,
                usageLimit,
                validDays,
                note,
                creator: auth.username,
            },
        });

        return NextResponse.json({
            success: true,
            message: `成功签发 ${count} 个专属学术邀请码`,
            codes: insertedCodes || [],
        });

    } catch (error: any) {
        console.error("[Admin Invites API] Batch generate exception:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}
