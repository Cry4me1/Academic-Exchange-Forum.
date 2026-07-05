import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { username, full_name, password } = await request.json();

        if (!username || !full_name || !password) {
            return NextResponse.json({ error: "请填写完整的注册信息" }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // 1. 检查用户名是否已被注册
        const { data: existingProfile } = await adminClient
            .from("profiles")
            .select("id")
            .eq("username", username)
            .maybeSingle();

        if (existingProfile) {
            return NextResponse.json({ error: "该用户名已被使用，请换一个用户名" }, { status: 400 });
        }

        // 2. 生成合法的 TLD 虚拟邮箱以绕过 TLD 校验且避免触发验证邮件发送限制
        const pseudoEmail = `${username.toLowerCase()}@scholarly.org`;

        // 3. 在服务端通过 Admin API 注册用户（自动标记 email_confirm 为 true）
        // 这样可以绕过 Supabase 前台的 SMTP 邮件发送频次限制且直接激活用户状态
        const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
            email: pseudoEmail,
            password: password,
            email_confirm: true, // 关键：设为 true 直接激活用户，绝不发送任何邮件
            user_metadata: {
                username: username,
                full_name: full_name,
                auth_provider: "username",
            }
        });

        if (createError) {
            console.error("[Username Register API] Create auth user failed:", createError);
            if (createError.message.includes("already registered")) {
                return NextResponse.json({ error: "该用户名对应的虚拟邮箱已被使用，请更换用户名" }, { status: 400 });
            }
            return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        const userId = authData.user?.id;
        if (!userId) {
            return NextResponse.json({ error: "注册失败，无法创建用户" }, { status: 500 });
        }

        // 强更新 profile 的 is_verified 字段，将其设为已验证状态
        await adminClient
            .from("profiles")
            .update({
                is_verified: true,
                auth_provider: "username",
            })
            .eq("id", userId);

        // 4. 利用 Admin API 为该注册成功的虚拟邮箱生成一次性 Magic Link 自动登录链接
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: "magiclink",
            email: pseudoEmail,
            options: {
                redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
            }
        });

        if (linkError || !linkData?.properties?.action_link) {
            console.error("[Username Register API] Generate login link failed:", linkError);
            // 提示用户虽然注册成功但需要手动登录一次
            return NextResponse.json({
                success: true,
                needManualLogin: true,
                message: "注册成功！由于登录会话生成失败，请使用刚刚注册的账号手动进行登录。"
            });
        }

        return NextResponse.json({
            success: true,
            actionLink: linkData.properties.action_link,
        });

    } catch (error: any) {
        console.error("[Username Register API] Error:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}
