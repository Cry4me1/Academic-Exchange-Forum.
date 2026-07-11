import { createAdminClient } from "@/lib/supabase/admin";
import { fetchLuoguUser, parseLuoguHtmlOrJson } from "@/lib/luogu";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { luoguId, luoguHtml } = await request.json();

        if (!luoguId) {
            return NextResponse.json({ error: "参数不完整" }, { status: 400 });
        }

        const cleanLuoguId = luoguId.trim();

        // 从 Cookie 中获取验证码
        const cookieStore = await cookies();
        const cookieName = `luogu_login_code_${cleanLuoguId}`;
        const verificationCode = cookieStore.get(cookieName)?.value;

        if (!verificationCode) {
            return NextResponse.json({ error: "验证码已过期或不存在，请重新获取" }, { status: 400 });
        }

        let result;
        if (luoguHtml) {
            console.log(`[Luogu Login Verify] Manual verify mode via HTML for UID: ${cleanLuoguId}`);
            result = parseLuoguHtmlOrJson(luoguHtml);
            
            if (result.ok && result.user && String(result.user.uid) !== cleanLuoguId) {
                return NextResponse.json({
                    error: `验证失败：复制的网页数据对应的 UID (${result.user.uid}) 与输入的 UID (${cleanLuoguId}) 不匹配！`
                }, { status: 400 });
            }
        } else {
            console.log(`[Luogu Login Verify] Auto fetch mode for UID: ${cleanLuoguId}`);
            result = await fetchLuoguUser(cleanLuoguId);
        }

        if (!result.ok || !result.user) {
            return NextResponse.json({
                error: `验证失败：${result.error || "无法获取洛谷用户信息"}。请确认 UID 正确并重试。`
            }, { status: 400 });
        }

        const { introduction, name: luoguUsername } = result.user;

        if (!introduction.includes(verificationCode)) {
            return NextResponse.json({
                error: "验证失败：未在个人介绍中找到验证码。请确保验证码正确保存于洛谷个人介绍中。"
            }, { status: 400 });
        }

        // 验证成功，清除验证码 Cookie
        cookieStore.delete(cookieName);

        const adminClient = createAdminClient();

        // 查找是否已存在绑定关系
        const { data: binding, error: bindingError } = await adminClient
            .from("user_oauth_accounts")
            .select("user_id")
            .eq("provider", "luogu")
            .eq("provider_user_id", cleanLuoguId)
            .maybeSingle();

        if (bindingError) {
            console.error("[Luogu Login Verify] Query binding error:", bindingError);
            return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
        }

        let targetEmail = "";

        if (binding) {
            // 已绑定：获取其 profile 和 email
            const { data: profile, error: profileError } = await adminClient
                .from("profiles")
                .select("email")
                .eq("id", binding.user_id)
                .single();

            if (profileError || !profile?.email) {
                console.error("[Luogu Login Verify] Get profile email error:", profileError);
                return NextResponse.json({ error: "该绑定账号对应的系统用户已被删除" }, { status: 400 });
            }

            targetEmail = profile.email;
        } else {
            // 未绑定：自动注册该洛谷账号
            const pseudoEmail = `luogu_${cleanLuoguId}@scholarly.org`;
            targetEmail = pseudoEmail;

            // 检查该邮箱对应的用户是否已被创建但未绑定（安全冗余）
            const { data: existingUser } = await adminClient.auth.admin.listUsers();
            const userFound = existingUser?.users?.find(u => u.email === pseudoEmail);

            let userId = userFound?.id;

            if (!userFound) {
                // 生成随机密码
                const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                
                // 创建 Auth 用户
                const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                    email: pseudoEmail,
                    password: randomPassword,
                    email_confirm: true, // 洛谷注册用户直接验证邮箱状态
                    user_metadata: {
                        username: luoguUsername,
                        full_name: luoguUsername,
                        auth_provider: "luogu",
                    }
                });

                if (createError || !newUser?.user) {
                    console.error("[Luogu Login Verify] Create user error:", createError);
                    return NextResponse.json({ error: "注册新用户失败，请重试" }, { status: 500 });
                }

                userId = newUser.user.id;
            }

            if (userId) {
                // 绑定到 user_oauth_accounts
                const { error: insertError } = await adminClient
                    .from("user_oauth_accounts")
                    .insert({
                        user_id: userId,
                        provider: "luogu",
                        provider_user_id: cleanLuoguId,
                        provider_username: luoguUsername,
                        is_verified: true,
                    });

                if (insertError) {
                    console.error("[Luogu Login Verify] Insert binding error:", insertError);
                    return NextResponse.json({ error: "关联洛谷账号失败" }, { status: 500 });
                }

                // 强制更新 profile 里的 is_verified 为 true 和 auth_provider 为 luogu
                await adminClient
                    .from("profiles")
                    .update({
                        is_verified: true,
                        auth_provider: "luogu",
                    })
                    .eq("id", userId);
            }
        }

        // 使用 Admin API 为该邮箱生成单次有效的 Magic Link
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: "magiclink",
            email: targetEmail,
            options: {
                redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
            }
        });

        if (linkError || !linkData?.properties?.action_link) {
            console.error("[Luogu Login Verify] Generate link error:", linkError);
            return NextResponse.json({ error: "生成登录会话失败" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            actionLink: linkData.properties.action_link,
        });

    } catch (error: any) {
        console.error("[Luogu Login Verify] Error:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}
