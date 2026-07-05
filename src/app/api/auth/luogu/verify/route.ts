import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "请先登录" }, { status: 401 });
        }

        const { luoguId, verificationCode } = await request.json();

        if (!luoguId || !verificationCode) {
            return NextResponse.json({ error: "参数不完整" }, { status: 400 });
        }

        // 规范化 Luogu ID
        const cleanLuoguId = luoguId.trim();

        // 尝试通过洛谷 API 获取用户信息
        // 洛谷的接口: https://www.luogu.com.cn/api/user/show/{uid}
        // 注意：洛谷有防爬机制，需要设置合理的 User-Agent
        let verified = false;
        let luoguUsername = `LuoguUser_${cleanLuoguId}`;
        let errorDetails = "";

        try {
            console.log(`[Luogu Verify] Fetching profile for UID: ${cleanLuoguId}`);
            const response = await fetch(`https://www.luogu.com.cn/api/user/show/${cleanLuoguId}`, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "application/json",
                },
                next: { revalidate: 0 } // 禁用缓存
            });

            if (response.ok) {
                const data = await response.json();
                const introduction = data.currentData?.user?.introduction || "";
                luoguUsername = data.currentData?.user?.name || luoguUsername;

                console.log(`[Luogu Verify] User Intro:`, introduction);
                console.log(`[Luogu Verify] Expected Code:`, verificationCode);

                if (introduction.includes(verificationCode)) {
                    verified = true;
                } else {
                    errorDetails = "未在个人介绍中找到验证码";
                }
            } else {
                console.error(`[Luogu Verify] Fetch failed: ${response.status} ${response.statusText}`);
                errorDetails = `洛谷接口访问失败 (状态码: ${response.status})`;
            }
        } catch (fetchError: any) {
            console.error(`[Luogu Verify] Fetch error:`, fetchError);
            errorDetails = `网络连接失败: ${fetchError.message}`;
        }

        // ⚠️ 针对开发环境/Cloudflare 防御的降级方案：
        // 如果抓取失败，且是在本地开发环境，我们允许进行模拟成功绑定，防止用户因为 CF 盾被卡住
        const isDev = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_SITE_URL?.includes("localhost");
        if (!verified && isDev) {
            console.log("[Luogu Verify] Dev Mode: Bypassing strict verification for testing.");
            verified = true;
            errorDetails = "";
        }

        if (!verified) {
            return NextResponse.json({
                error: `验证失败：${errorDetails || "个人介绍中未检测到验证码"}。请确保验证码正确写入洛谷“个人介绍”中，并等待几秒后重试。`
            }, { status: 400 });
        }

        // 验证成功，保存绑定关系到数据库
        const { error: dbError } = await supabase
            .from("user_oauth_accounts")
            .insert({
                user_id: user.id,
                provider: "luogu",
                provider_user_id: cleanLuoguId,
                provider_username: luoguUsername,
                is_verified: true,
            });

        if (dbError) {
            console.error("[Luogu Verify] DB Error:", dbError);
            if (dbError.message.includes("unique_conflict") || dbError.code === "23505") {
                return NextResponse.json({ error: "该洛谷账号已被其他用户绑定" }, { status: 400 });
            }
            return NextResponse.json({ error: "绑定账号失败，数据库错误" }, { status: 500 });
        }

        // 更新用户 profile 中的验证状态
        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                is_verified: true,
                auth_provider: "luogu",
            })
            .eq("id", user.id);

        if (profileError) {
            console.error("[Luogu Verify] Profile Update Error:", profileError);
        }

        return NextResponse.json({ success: true, username: luoguUsername });

    } catch (error: any) {
        console.error("[Luogu Verify] Uncaught Error:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "请先登录" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const provider = searchParams.get("provider");

        if (provider !== "luogu") {
            return NextResponse.json({ error: "不支持的第三方渠道" }, { status: 400 });
        }

        // 删除绑定关系
        const { error: dbError } = await supabase
            .from("user_oauth_accounts")
            .delete()
            .eq("user_id", user.id)
            .eq("provider", "luogu");

        if (dbError) {
            console.error("[Luogu Unbind] DB Error:", dbError);
            return NextResponse.json({ error: "解绑失败" }, { status: 500 });
        }

        // 检查用户是否还有其他验证方式，如果没有，更新 is_verified 为 false
        const { data: remainingAccounts } = await supabase
            .from("user_oauth_accounts")
            .select("id")
            .eq("user_id", user.id);

        const hasOtherVerified = (remainingAccounts && remainingAccounts.length > 0) || user.email_confirmed_at;

        if (!hasOtherVerified) {
            await supabase
                .from("profiles")
                .update({
                    is_verified: false,
                    auth_provider: "email",
                })
                .eq("id", user.id);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[Luogu Unbind] Error:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}
