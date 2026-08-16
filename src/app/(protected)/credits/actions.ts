"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================
// 查询当前用户积分余额
// ============================================
export async function getMyCredits() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "请先登录", balance: 0, totalSpent: 0, totalRecharged: 0, vipLevel: 1 };
    }

    // [新增] 每次获取用户积分时，触发一次“当月奖励检查”
    // 这个操作是懒加载的，RPC 内部会判断如果当月已领取就不再操作
    await supabase.rpc("claim_monthly_bonus");

    const { data, error } = await supabase
        .from("user_credits")
        .select("balance, total_spent, total_recharged")
        .eq("user_id", user.id)
        .single();

    if (error || !data) {
        // 如果还没有记录, 返回 0
        return { balance: 0, totalSpent: 0, totalRecharged: 0, vipLevel: 1 };
    }

    // 获取 profiles 中的 vip_level
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("vip_level")
        .eq("id", user.id)
        .single();

    console.log("DEBUG: getMyCredits profile fetch:", { profile, profileError, userId: user.id });

    return {
        balance: data.balance,
        totalSpent: data.total_spent,
        totalRecharged: data.total_recharged,
        vipLevel: profile?.vip_level ?? 1,
    };
}

// ============================================
// 查询当前用户消费流水
// ============================================
export async function getMyTransactions(limit = 20, offset = 0) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "请先登录", transactions: [] };
    }

    const { data, error } = await supabase
        .from("credit_transactions")
        .select("id, amount, type, description, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("获取流水失败:", error);
        return { error: "获取流水失败", transactions: [] };
    }

    return { transactions: data || [] };
}

// ============================================
// 购买积分（支付渠道尚未接入，fail-closed）
// ============================================
export async function purchaseCredits(
    _planId: string
): Promise<{ error: string; newBalance?: number }> {
    // 支付渠道未接入（CreditRechargeDialog 的购买按钮为 disabled）。
    // 积分发放只能由支付回调 Webhook 以 service_role 调用 add_user_credits 完成，
    // 禁止用户会话直接铸造积分（P0-2 修复后 add_user_credits 仅 service_role 可调用）。
    return { error: "支付功能即将上线，暂不支持直接充值" };
}
