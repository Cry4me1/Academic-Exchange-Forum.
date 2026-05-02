"use server";

import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "./permissions";
import { revalidatePath } from "next/cache";

// ===== 类型定义 =====

export interface CreditsConfig {
  signup_bonus: number;
  monthly_bonus: number;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user_name?: string | null;
  user_email?: string | null;
  user_avatar?: string | null;
}

export interface CreditTransactionFilters {
  type?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  page?: number;
  pageSize?: number;
}

export interface CreditStats {
  totalBalance: number;
  totalSpent: number;
  totalRecharged: number;
  totalTransactions: number;
  todayTransactions: number;
  todayAmount: number;
  avgBalance: number;
  typeBreakdown: { type: string; count: number; total_amount: number }[];
}

export interface VipLevelConfigRow {
  level: number;
  name: string;
  title: string;
  min_spent: number;
  color_scheme: Record<string, string>;
  perks: string[];
  is_active: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface BatchGrant {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  grant_type: string;
  target_criteria: Record<string, unknown>;
  affected_user_count: number;
  total_amount_granted: number;
  status: string;
  created_by: string;
  executed_at: string | null;
  created_at: string;
  creator_name?: string | null;
}

// ===== 积分策略配置 =====

/**
 * 获取积分策略配置
 */
export async function getCreditsConfig(): Promise<CreditsConfig> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "credits")
    .single();

  const raw = data?.value as Record<string, unknown> | null;
  return {
    signup_bonus: (raw?.signup_bonus as number) ?? 100,
    monthly_bonus: (raw?.monthly_bonus as number) ?? 50,
  };
}

/**
 * 更新积分策略配置
 */
export async function updateCreditsConfig(config: CreditsConfig) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 验证参数
  if (config.signup_bonus < 0) throw new Error("注册奖励不能为负数");
  if (config.monthly_bonus < 0) throw new Error("每月奖励不能为负数");

  // 获取旧配置
  const oldConfig = await getCreditsConfig();

  const { error } = await supabase
    .from("system_settings")
    .update({
      value: config,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "credits");

  if (error) throw new Error(`更新积分配置失败: ${error.message}`);

  await logAdminAction({
    actionType: "credits_config_updated",
    targetType: "system_settings",
    details: {
      old_config: oldConfig,
      new_config: config,
    },
  });

  revalidatePath("/admin/credits");
  return { success: true };
}

// ===== 积分流水查询 =====

/**
 * 获取积分流水统计数据
 */
export async function getCreditStats(): Promise<CreditStats> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [
    creditsResult,
    totalTxResult,
    todayTxResult,
    typeBreakdownResult,
  ] = await Promise.all([
    // 积分余额统计
    supabase
      .from("user_credits")
      .select("balance, total_spent, total_recharged"),
    // 总流水数
    supabase
      .from("credit_transactions")
      .select("id", { count: "exact", head: true }),
    // 今日流水
    supabase
      .from("credit_transactions")
      .select("amount")
      .gte("created_at", todayISO),
    // 按类型分组统计
    supabase
      .from("credit_transactions")
      .select("type, amount"),
  ]);

  const credits = creditsResult.data ?? [];
  const totalBalance = credits.reduce((sum, c) => sum + (c.balance ?? 0), 0);
  const totalSpent = credits.reduce((sum, c) => sum + (c.total_spent ?? 0), 0);
  // 总发放 = 流水中所有正向金额之和，排除管理员手动调整
  const allTx = typeBreakdownResult.data ?? [];
  const totalRecharged = allTx
    .filter((t) => (t.amount ?? 0) > 0 && t.type !== "admin_adjustment")
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);
  const avgBalance =
    credits.length > 0 ? Math.round(totalBalance / credits.length) : 0;

  const todayTx = todayTxResult.data ?? [];
  const todayAmount = todayTx.reduce((sum, t) => sum + (t.amount ?? 0), 0);

  // 计算类型分组
  const typeMap = new Map<string, { count: number; total_amount: number }>();
  for (const tx of typeBreakdownResult.data ?? []) {
    const existing = typeMap.get(tx.type) ?? { count: 0, total_amount: 0 };
    existing.count += 1;
    existing.total_amount += tx.amount ?? 0;
    typeMap.set(tx.type, existing);
  }
  const typeBreakdown = Array.from(typeMap.entries()).map(([type, data]) => ({
    type,
    ...data,
  }));

  return {
    totalBalance,
    totalSpent,
    totalRecharged,
    totalTransactions: totalTxResult.count ?? 0,
    todayTransactions: todayTx.length,
    todayAmount,
    avgBalance,
    typeBreakdown,
  };
}

/**
 * 分页查询积分流水
 */
export async function getCreditTransactions(
  filters: CreditTransactionFilters
): Promise<{ data: CreditTransaction[]; total: number }> {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("credit_transactions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }
  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (filters.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  const { data, count, error } = await query;

  if (error) throw new Error(`查询积分流水失败: ${error.message}`);

  // 获取关联用户信息
  const transactions = data ?? [];
  if (transactions.length > 0) {
    const userIds = [...new Set(transactions.map((t) => t.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [
        p.id,
        { name: p.full_name, email: p.email, avatar: p.avatar_url },
      ])
    );

    for (const tx of transactions) {
      const profile = profileMap.get(tx.user_id);
      tx.user_name = profile?.name ?? null;
      tx.user_email = profile?.email ?? null;
      tx.user_avatar = profile?.avatar ?? null;
    }
  }

  return {
    data: transactions as CreditTransaction[],
    total: count ?? 0,
  };
}

// ===== 批量积分发放 =====

/**
 * 执行批量积分发放
 */
export async function executeBatchGrant(params: {
  title: string;
  description?: string;
  amount: number;
  grantType: string;
  targetType: "all" | "vip_level" | "user_ids";
  minVipLevel?: number;
  userIds?: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("未登录");
  if (params.amount <= 0) throw new Error("发放金额必须大于 0");

  const targetCriteria: Record<string, unknown> = {
    type: params.targetType,
  };

  // 根据条件获取目标用户
  let targetUserIds: string[] = [];

  if (params.targetType === "all") {
    const { data: allUsers } = await supabase
      .from("user_credits")
      .select("user_id");
    targetUserIds = (allUsers ?? []).map((u) => u.user_id);
  } else if (params.targetType === "vip_level" && params.minVipLevel) {
    targetCriteria.min_level = params.minVipLevel;
    const { data: vipUsers } = await supabase
      .from("profiles")
      .select("id")
      .gte("vip_level", params.minVipLevel);
    targetUserIds = (vipUsers ?? []).map((u) => u.id);
  } else if (params.targetType === "user_ids" && params.userIds) {
    targetCriteria.ids = params.userIds;
    targetUserIds = params.userIds;
  }

  if (targetUserIds.length === 0) {
    throw new Error("没有符合条件的用户");
  }

  // 创建批量发放记录
  const { data: batch, error: batchError } = await supabase
    .from("credit_batch_grants")
    .insert({
      title: params.title,
      description: params.description,
      amount: params.amount,
      grant_type: params.grantType,
      target_criteria: targetCriteria,
      affected_user_count: targetUserIds.length,
      total_amount_granted: params.amount * targetUserIds.length,
      status: "processing",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (batchError) throw new Error(`创建批量发放记录失败: ${batchError.message}`);

  try {
    // 逐个用户发放积分（使用 RPC 保证原子性）
    for (const userId of targetUserIds) {
      const txType = params.grantType === "event_bonus" ? "event_bonus" : "admin_adjustment";
      const { error: rpcError } = await supabase.rpc("add_user_credits", {
        p_user_id: userId,
        p_amount: params.amount,
        p_type: txType,
        p_description: `[批量发放] ${params.title}`,
      });

      if (rpcError) {
        console.error(`Failed to grant credits to ${userId}:`, rpcError);
      }
    }

    // 发送通知给所有目标用户
    const notifications = targetUserIds.map((userId) => ({
      user_id: userId,
      type: "system" as const,
      title: "🎉 积分发放通知",
      content: `您获得了 ${params.amount} 积分奖励！${params.title}${params.description ? `：${params.description}` : ""}`,
    }));

    // 批量插入通知（每批最多 100 条）
    for (let i = 0; i < notifications.length; i += 100) {
      const batch_notifs = notifications.slice(i, i + 100);
      await supabase.from("notifications").insert(batch_notifs);
    }

    // 更新批量记录状态为完成
    await supabase
      .from("credit_batch_grants")
      .update({
        status: "completed",
        executed_at: new Date().toISOString(),
      })
      .eq("id", batch.id);

    await logAdminAction({
      actionType: "batch_credits_granted",
      targetType: "credits",
      details: {
        batch_id: batch.id,
        title: params.title,
        amount: params.amount,
        target_type: params.targetType,
        affected_users: targetUserIds.length,
        total_granted: params.amount * targetUserIds.length,
      },
    });

    revalidatePath("/admin/credits");
    return {
      success: true,
      affectedUsers: targetUserIds.length,
      totalGranted: params.amount * targetUserIds.length,
    };
  } catch (err) {
    // 标记为失败
    await supabase
      .from("credit_batch_grants")
      .update({ status: "failed" })
      .eq("id", batch.id);

    throw new Error(
      `批量发放失败: ${err instanceof Error ? err.message : "unknown"}`
    );
  }
}

/**
 * 获取批量发放历史
 */
export async function getBatchGrants(): Promise<BatchGrant[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("credit_batch_grants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`查询批量发放历史失败: ${error.message}`);

  const grants = data ?? [];

  // 获取创建人信息
  if (grants.length > 0) {
    const creatorIds = [...new Set(grants.map((g) => g.created_by))];
    const { data: creators } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", creatorIds);

    const creatorMap = new Map(
      (creators ?? []).map((c) => [c.id, c.full_name])
    );

    for (const grant of grants) {
      grant.creator_name = creatorMap.get(grant.created_by) ?? null;
    }
  }

  return grants as BatchGrant[];
}

// ===== VIP 等级配置 =====

/**
 * 获取 VIP 等级配置
 */
export async function getVipLevelConfig(): Promise<VipLevelConfigRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vip_level_config")
    .select("*")
    .order("level", { ascending: true });

  if (error) throw new Error(`获取 VIP 配置失败: ${error.message}`);
  return (data ?? []) as VipLevelConfigRow[];
}

/**
 * 更新单个 VIP 等级配置
 */
export async function updateVipLevelConfig(
  level: number,
  updates: {
    name?: string;
    title?: string;
    min_spent?: number;
    perks?: string[];
    is_active?: boolean;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 获取旧配置
  const { data: oldConfig } = await supabase
    .from("vip_level_config")
    .select("*")
    .eq("level", level)
    .single();

  const { error } = await supabase
    .from("vip_level_config")
    .update({
      ...updates,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq("level", level);

  if (error) throw new Error(`更新 VIP 配置失败: ${error.message}`);

  // 重新同步所有用户的 VIP 等级（应用新的称号/阈值）
  await supabase.rpc("sync_all_vip_titles" as string);

  await logAdminAction({
    actionType: "vip_config_updated",
    targetType: "vip_level_config",
    details: {
      level,
      old_config: oldConfig,
      new_config: updates,
    },
  });

  revalidatePath("/admin/credits");
  revalidatePath("/vip");
  return { success: true };
}

/**
 * 获取所有用户的积分概览（用于批量发放时选择用户）
 */
export async function getUserCreditsOverview(): Promise<
  {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    vip_level: number;
    balance: number;
    total_spent: number;
  }[]
> {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, vip_level")
    .order("created_at", { ascending: false });

  if (!profiles || profiles.length === 0) return [];

  const { data: credits } = await supabase
    .from("user_credits")
    .select("user_id, balance, total_spent");

  const creditMap = new Map(
    (credits ?? []).map((c) => [
      c.user_id,
      { balance: c.balance, total_spent: c.total_spent },
    ])
  );

  return profiles.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    avatar_url: p.avatar_url,
    vip_level: p.vip_level ?? 1,
    balance: creditMap.get(p.id)?.balance ?? 0,
    total_spent: creditMap.get(p.id)?.total_spent ?? 0,
  }));
}
