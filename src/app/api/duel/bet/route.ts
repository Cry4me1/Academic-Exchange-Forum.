import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { duelId, targetId, amount } = body;

        if (!duelId || !targetId || !amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        // 下注逻辑已收口到 SECURITY DEFINER RPC：
        // 原子「校验（决斗状态/选手自押/押注对象/重复下注/余额）→ 扣分 → 插单」，
        // 客户端无法再绕过扣款直接 INSERT duel_bets。
        const { data, error } = await supabase.rpc("place_duel_bet", {
            p_duel_id: duelId,
            p_target_id: targetId,
            p_amount: amount,
        });

        if (error) {
            console.error("Place bet RPC error:", error);
            return NextResponse.json({ error: "下注失败，请稍后重试" }, { status: 500 });
        }

        const result = data as { success: boolean; bet_id?: string; error?: string };

        if (!result.success) {
            const messageMap: Record<string, string> = {
                INVALID_AMOUNT: "下注金额无效",
                DUEL_NOT_FOUND: "决斗不存在",
                DUEL_NOT_ACTIVE: "只能在进行中的决斗下注",
                PARTICIPANT_CANNOT_BET: "决斗选手不能下注",
                INVALID_TARGET: "押注对象无效",
                ALREADY_BET: "您已对本场决斗进行过下注",
                INSUFFICIENT_REPUTATION: "信誉分不足",
            };
            return NextResponse.json(
                { error: messageMap[result.error ?? ""] ?? "下注失败" },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, bet_id: result.bet_id });
    } catch (error) {
        console.error("Bet error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
