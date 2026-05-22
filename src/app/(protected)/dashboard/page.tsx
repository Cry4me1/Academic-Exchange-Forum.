import { createClient } from "@/lib/supabase/server";
import { getMyCredits } from "@/app/(protected)/credits/actions";
import DashboardClient from "./DashboardClient";
import type { DashboardInitialData } from "./DashboardClient";

/**
 * Dashboard 服务端页面
 * 在 Vercel Edge (东京) 上预获取用户数据，避免客户端跨海请求
 * 
 * 性能提升:
 *   之前: 用户浏览器(中国) → Supabase(东京) × 3次 = 300-900ms
 *   现在: Vercel Edge(东京) → Supabase(东京) × 2次 = 10-30ms (同区域)
 */
export default async function DashboardPage() {
    const supabase = await createClient();

    // 并行获取用户数据和积分（服务端同区域，延迟极低）
    const [userResult, credits] = await Promise.all([
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data: profile } = await supabase
                .from("profiles")
                .select("username, email, avatar_url")
                .eq("id", user.id)
                .single();

            // 如果 profile 不存在，自动创建
            if (!profile) {
                const newProfile = {
                    id: user.id,
                    email: user.email || null,
                    username: user.email?.split("@")[0] || "User",
                    avatar_url: "",
                };

                await supabase.from("profiles").insert([newProfile]);

                return {
                    id: user.id,
                    username: newProfile.username,
                    email: newProfile.email,
                    avatar_url: newProfile.avatar_url,
                    created_at: user.created_at,
                };
            }

            return {
                id: user.id,
                username: profile.username,
                email: profile.email,
                avatar_url: profile.avatar_url,
                created_at: user.created_at,
            };
        })(),
        getMyCredits().catch(() => ({ balance: 0 })),
    ]);

    // 构建初始数据（用户数据已通过 protected layout 验证）
    const initialData: DashboardInitialData = {
        user: userResult || {
            id: "",
            username: null,
            email: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
        },
        creditBalance: credits.balance,
    };

    return <DashboardClient initialData={initialData} />;
}
