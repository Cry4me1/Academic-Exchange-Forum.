import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Invite820Client, type InviteCodePublicItem, type PublicStatsData } from "./Invite820Client";

export const metadata: Metadata = {
    title: "820 学术创世邀请计划 · 开放通行席位先到先得 - Scholarly",
    description: "Scholarly 820 学术创世邀请码公开抢兑看板。特邀学者席位限时先到先得，一键复制直通学术研讨与同行评议社区。",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getInitialInviteData(): Promise<{ codes: InviteCodePublicItem[]; stats: PublicStatsData }> {
    try {
        const adminClient = createAdminClient();

        const { data: rawCodes, error } = await adminClient
            .from("invitation_codes")
            .select("id, code, usage_limit, used_count, is_active, expires_at, note, created_at")
            .order("created_at", { ascending: false });

        if (error || !rawCodes) {
            console.error("[Invite 820 Page SSR] Error fetching codes:", error);
            return {
                codes: [],
                stats: {
                    totalCapacity: 0,
                    claimedSeats: 0,
                    remainingSeats: 0,
                    activeCodesCount: 0,
                    exhaustedCodesCount: 0,
                    totalCodesCount: 0,
                    claimRate: 0,
                    lastUpdated: new Date().toISOString(),
                },
            };
        }

        const now = new Date();
        let totalCapacity = 0;
        let claimedSeats = 0;
        let remainingSeats = 0;
        let activeCodesCount = 0;
        let exhaustedCodesCount = 0;

        const codes: InviteCodePublicItem[] = rawCodes.map((c) => {
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

        return {
            codes,
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
        };
    } catch (e) {
        console.error("[Invite 820 Page SSR] Exception:", e);
        return {
            codes: [],
            stats: {
                totalCapacity: 0,
                claimedSeats: 0,
                remainingSeats: 0,
                activeCodesCount: 0,
                exhaustedCodesCount: 0,
                totalCodesCount: 0,
                claimRate: 0,
                lastUpdated: new Date().toISOString(),
            },
        };
    }
}

export default async function Invite820Page() {
    const { codes, stats } = await getInitialInviteData();

    return (
        <Invite820Client
            initialCodes={codes}
            initialStats={stats}
        />
    );
}
