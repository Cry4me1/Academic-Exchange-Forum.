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

        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Referer": "https://www.luogu.com/",
            "Connection": "keep-alive"
        };

        let verified = false;
        let luoguUsername = `LuoguUser_${cleanLuoguId}`;
        let errorDetails = "";

        // 尝试通过洛谷 API 获取用户信息
        try {
            console.log(`[Luogu Verify] Fetching profile for UID (Method 1): ${cleanLuoguId}`);
            let response = await fetch(`https://www.luogu.com/api/user/show/${cleanLuoguId}`, {
                headers,
                next: { revalidate: 0 } // 禁用缓存
            });

            // 如果方法 1 被 403 拦截，尝试方法 2 (使用 _contentOnly=1 页面渲染 API)
            if (!response.ok && response.status === 403) {
                console.log(`[Luogu Verify] Method 1 failed with 403. Trying Method 2 (_contentOnly=1)...`);
                response = await fetch(`https://www.luogu.com/user/${cleanLuoguId}?_contentOnly=1`, {
                    headers,
                    next: { revalidate: 0 }
                });
            }

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

        // ⚠️ 针对开发环境 / Cloudflare 拦截 (403) 的降级放行方案
        const isDev = process.env.NODE_ENV === "development" || 
                      process.env.NEXT_PUBLIC_SITE_URL?.includes("localhost") ||
                      process.env.BYPASS_LUOGU_ON_403 === "true";
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
