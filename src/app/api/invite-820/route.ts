import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    try {
        const adminClient = createAdminClient();

        // 仅查询公开必要字段，严格隔离敏感信息与创建人私人邮箱
        const { data: rawCodes, error } = await adminClient
            .from("invitation_codes")
            .select("id, code, usage_limit, used_count, is_active, expires_at, note, created_at")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("[Invite 820 Public API] Error fetching codes:", error);
            return NextResponse.json({ error: "获取邀请码数据失败" }, { status: 500 });
        }

        const now = new Date();
        const codes = rawCodes || [];

        let totalCapacity = 0;
        let claimedSeats = 0;
        let remainingSeats = 0;
        let activeCodesCount = 0;
        let exhaustedCodesCount = 0;

        const formattedCodes = codes.map((c) => {
            const usageLimit = c.usage_limit || 1;
            const usedCount = c.used_count || 0;
            const remaining = Math.max(0, usageLimit - usedCount);
            const isExpired = c.expires_at ? new Date(c.expires_at) < now : false;
            const isAvailable = c.is_active && !isExpired && remaining > 0;
            const isExhausted = c.is_active && !isExpired && remaining === 0;

            totalCapacity += usageLimit;
            claimedSeats += usedCount;

            if (isAvailable) {
                remainingSeats += remaining;
                activeCodesCount++;
            } else if (isExhausted) {
                exhaustedCodesCount++;
            }

            return {
                id: c.id,
                code: c.code,
                usage_limit: usageLimit,
                used_count: usedCount,
                remaining_uses: remaining,
                percent_used: Math.min(100, Math.round((usedCount / usageLimit) * 100)),
                is_active: c.is_active,
                is_expired: isExpired,
                is_available: isAvailable,
                is_exhausted: isExhausted,
                expires_at: c.expires_at,
                note: c.note || "学术创世通行",
                created_at: c.created_at,
            };
        });

        const claimRate = totalCapacity > 0 ? Math.round((claimedSeats / totalCapacity) * 100) : 0;

        return NextResponse.json({
            success: true,
            stats: {
                totalCapacity,
                claimedSeats,
                remainingSeats,
                activeCodesCount,
                exhaustedCodesCount,
                totalCodesCount: codes.length,
                claimRate,
                lastUpdated: new Date().toISOString(),
            },
            codes: formattedCodes,
        }, {
            headers: {
                "Cache-Control": "no-store, max-age=0",
            },
        });
    } catch (error: any) {
        console.error("[Invite 820 Public API] Exception:", error);
        return NextResponse.json({ error: "服务器内部异常" }, { status: 500 });
    }
}
