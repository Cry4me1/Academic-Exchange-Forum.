import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AdminRole = "super_admin" | "admin" | "moderator" | "analyst";

export interface AdminUser {
  id: string;
  role: AdminRole;
  fullName: string | null;
  avatarUrl: string | null;
  email: string | null;
}

/**
 * 获取当前用户的管理员角色
 * 如果不是管理员则返回 null
 */
export async function getAdminRole(): Promise<AdminRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  return (data?.role as AdminRole) ?? null;
}

/**
 * 验证当前用户是否为管理员，如果不是则重定向
 * 返回当前用户信息和角色
 */
export async function requireAdmin(
  minRole: AdminRole = "analyst"
): Promise<AdminUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: adminRole } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!adminRole) {
    redirect("/dashboard");
  }

  const roleHierarchy: Record<AdminRole, number> = {
    analyst: 1,
    moderator: 2,
    admin: 3,
    super_admin: 4,
  };

  const userRoleLevel = roleHierarchy[adminRole.role as AdminRole] ?? 0;
  const requiredLevel = roleHierarchy[minRole];

  if (userRoleLevel < requiredLevel) {
    redirect("/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    role: adminRole.role as AdminRole,
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    email: profile?.email ?? user.email ?? null,
  };
}

/**
 * 检查是否有指定权限
 */
export function hasPermission(
  userRole: AdminRole,
  requiredRole: AdminRole
): boolean {
  const roleHierarchy: Record<AdminRole, number> = {
    analyst: 1,
    moderator: 2,
    admin: 3,
    super_admin: 4,
  };

  return (roleHierarchy[userRole] ?? 0) >= (roleHierarchy[requiredRole] ?? 0);
}

/**
 * 记录管理员操作日志
 */
export async function logAdminAction(params: {
  actionType: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("admin_action_logs").insert({
    admin_id: user.id,
    action_type: params.actionType,
    target_type: params.targetType,
    target_id: params.targetId,
    details: params.details ?? {},
  });
}
