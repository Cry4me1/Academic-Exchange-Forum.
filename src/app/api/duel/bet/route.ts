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

        // 1. 获取用户信息和信誉分
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("reputation_score")
            .eq("id", session.user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        if (profile.reputation_score < amount) {
            return NextResponse.json({ error: "信誉分不足" }, { status: 400 });
        }

        // 2. 获取决斗状态（必须是 active）
        const { data: duel, error: duelError } = await supabase
            .from("duels")
            .select("status, challenger_id, opponent_id")
            .eq("id", duelId)
            .single();

        if (duelError || !duel) {
            return NextResponse.json({ error: "Duel not found" }, { status: 404 });
        }

        if (duel.status !== "active") {
            return NextResponse.json({ error: "只能在进行中的决斗下注" }, { status: 400 });
        }

        if (session.user.id === duel.challenger_id || session.user.id === duel.opponent_id) {
            return NextResponse.json({ error: "决斗选手不能下注" }, { status: 400 });
        }

        // 检查是否已经下注过（每个用户一场只能下注一次）
        const { data: existingBet } = await supabase
            .from("duel_bets")
            .select("id")
            .eq("duel_id", duelId)
            .eq("spectator_id", session.user.id)
            .single();

        if (existingBet) {
            return NextResponse.json({ error: "您已对本场决斗进行过下注" }, { status: 400 });
        }

        // 3. 扣除信誉分并插入下注记录
        // 为了确保一致性，理想情况下应使用 RPC，这里我们先扣除再插入
        const { error: deductError } = await supabase
            .from("profiles")
            .update({ reputation_score: profile.reputation_score - amount })
            .eq("id", session.user.id);

        if (deductError) {
            return NextResponse.json({ error: "扣除信誉分失败" }, { status: 500 });
        }

        const { data: bet, error: betError } = await supabase
            .from("duel_bets")
            .insert({
                duel_id: duelId,
                spectator_id: session.user.id,
                target_id: targetId,
                amount: amount,
                status: "pending"
            })
            .select()
            .single();

        if (betError) {
            // 回滚（实际生产建议用 RPC/事务）
            await supabase
                .from("profiles")
                .update({ reputation_score: profile.reputation_score })
                .eq("id", session.user.id);
                
            return NextResponse.json({ error: "下注记录创建失败" }, { status: 500 });
        }

        return NextResponse.json({ success: true, bet });

    } catch (error) {
        console.error("Bet error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
