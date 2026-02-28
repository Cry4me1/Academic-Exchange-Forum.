"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// 积分定价方案
// ============================================
const PRICING_PLANS: Record<string, { credits: number; bonus: number; priceYuan: number }> = {
    basic: { credits: 100, bonus: 0, priceYuan: 10 },
    pro: { credits: 500, bonus: 50, priceYuan: 50 },
    scholar: { credits: 1000, bonus: 200, priceYuan: 100 },
};

// ============================================
// 查询当前用户积分余额
// ============================================
export async function getMyCredits() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "请先登录", balance: 0, totalSpent: 0, totalRecharged: 0 };
    }

    // [新增] 每次获取用户积分时，触发一次“当月奖励检查”
    // 这个操作是懒加载的，RPC 内部会判断如果当月已领取就不再操作
    await supabase.rpc("claim_monthly_bonus", { p_user_id: user.id });

    const { data, error } = await supabase
        .from("user_credits")
        .select("balance, total_spent, total_recharged")
        .eq("user_id", user.id)
        .single();

    if (error || !data) {
        // 如果还没有记录, 返回 0
        return { balance: 0, totalSpent: 0, totalRecharged: 0 };
    }

    return {
        balance: data.balance,
        totalSpent: data.total_spent,
        totalRecharged: data.total_recharged,
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
        .select("id, amount, type, description, created_at")
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
// 购买积分 (模拟支付成功后的积分发放)
// ============================================
export async function purchaseCredits(planId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "请先登录" };
    }

    const plan = PRICING_PLANS[planId];
    if (!plan) {
        return { error: "无效的套餐" };
    }

    const totalCredits = plan.credits + plan.bonus;
    const description = `购买${planId === "basic" ? "基础包" : planId === "pro" ? "进阶包" : "学术探索包"} (¥${plan.priceYuan})`;

    // 调用 RPC 增加积分
    const { data, error } = await supabase.rpc("add_user_credits", {
        p_user_id: user.id,
        p_amount: totalCredits,
        p_type: "purchase",
        p_description: description,
    });

    if (error) {
        console.error("购买积分失败:", error);
        return { error: "购买失败，请稍后重试" };
    }

    const result = data as { success: boolean; new_balance: number };

    if (!result.success) {
        return { error: "购买失败" };
    }

    revalidatePath("/vip");
    revalidatePath("/dashboard");

    return {
        success: true,
        newBalance: result.new_balance,
    };
}
