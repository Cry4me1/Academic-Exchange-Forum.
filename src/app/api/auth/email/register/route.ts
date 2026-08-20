import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations/auth";
import { registerLimiter } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import {
    getRegistrationMode,
    validateInviteCodeServer,
    consumeInviteCodeServer,
} from "@/lib/invite/service";

export async function POST(request: Request) {
    try {
        const forwarded = request.headers.get("x-forwarded-for");
        const userAgent = request.headers.get("user-agent") || "";
        const ip = forwarded?.split(",")[0]?.trim() || "unknown";

        // 1. IP 限流检查
        const { limited, resetIn } = registerLimiter.check(ip);
        if (limited) {
            return NextResponse.json(
                { error: `注册请求过于频繁，请 ${Math.ceil(resetIn / 60000)} 分钟后重试` },
                { status: 429 }
            );
        }

        const body = await request.json();

        // 2. 蜜罐检测 (Honeypot)
        if (body.honeypot && String(body.honeypot).trim().length > 0) {
            console.warn(`[Bot Detected] Honeypot triggered from IP: ${ip}`);
            return NextResponse.json(
                { error: "安全校验未通过，请刷新页面重试" },
                { status: 400 }
            );
        }

        // 3. 表单提交时间差检测
        if (body.renderedAt && typeof body.renderedAt === "number") {
            const timeDiff = Date.now() - body.renderedAt;
            if (timeDiff < 1200) {
                return NextResponse.json(
                    { error: "提交速度过快，请稍后重试" },
                    { status: 400 }
                );
            }
        }

        // 4. Schema 格式校验
        const validated = registerSchema.safeParse(body);
        if (!validated.success) {
            return NextResponse.json(
                { error: validated.error.issues[0]?.message || "参数错误" },
                { status: 400 }
            );
        }

        const { username, full_name, email, password, captchaToken, captchaCode, inviteCode } = validated.data;

        // 5. 系统注册模式策略判定（严格邀请制）
        const regMode = await getRegistrationMode();
        if (regMode === "CLOSED") {
            return NextResponse.json(
                { error: "Scholarly 学术论坛当前暂停新用户注册，请关注官方公告" },
                { status: 403 }
            );
        }

        const trimmedInviteCode = inviteCode?.trim() || "";

        if (regMode === "INVITE_ONLY") {
            if (!trimmedInviteCode) {
                return NextResponse.json(
                    { error: "当前社区处于邀请制研讨阶段，请输入有效的学术邀请码" },
                    { status: 400 }
                );
            }
        }

        // 预检邀请码合法性
        if (trimmedInviteCode) {
            const validation = await validateInviteCodeServer(trimmedInviteCode);
            if (!validation.valid) {
                return NextResponse.json(
                    { error: validation.error || "邀请码无效或已失效" },
                    { status: 400 }
                );
            }
        }

        // 6. 服务端人机验证码校验
        const captchaResult = verifyCaptcha(captchaToken, captchaCode);
        if (!captchaResult.success) {
            return NextResponse.json(
                { error: captchaResult.message || "人机验证未通过" },
                { status: 400 }
            );
        }

        const adminClient = createAdminClient();

        // 7. 检查用户名是否已被注册
        const { data: existingProfile } = await adminClient
            .from("profiles")
            .select("id")
            .eq("username", username)
            .maybeSingle();

        if (existingProfile) {
            return NextResponse.json(
                { error: "该用户名已被使用，请换一个用户名" },
                { status: 400 }
            );
        }

        // 8. 发起 Supabase 邮箱注册
        const supabase = await createClient();
        const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const redirectTo = `${origin}/auth/callback?next=/dashboard`;

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectTo,
                data: {
                    username,
                    full_name: full_name || username,
                    name: full_name || username,
                    display_name: full_name || username,
                    auth_provider: "email",
                    invite_code: trimmedInviteCode || undefined,
                },
            },
        });

        if (authError) {
            console.error("[Email Register API] Supabase auth error:", authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
            return NextResponse.json(
                { error: "该邮箱已被注册，请直接登录" },
                { status: 400 }
            );
        }

        const userId = authData.user?.id;

        // 9. 原子核销邀请码
        if (userId && trimmedInviteCode) {
            const consumeRes = await consumeInviteCodeServer({
                code: trimmedInviteCode,
                userId: userId,
                username: username,
                email: email,
                ip: ip,
                userAgent: userAgent,
            });

            if (!consumeRes.success) {
                console.warn(`[Email Register API] Consume invite code warning for user ${userId}:`, consumeRes.error);
            }
        }

        return NextResponse.json({
            success: true,
            message: "注册成功！请检查邮箱完成验证",
            user: authData.user ? { id: authData.user.id, email: authData.user.email } : null,
        });

    } catch (error: any) {
        console.error("[Email Register API] Internal error:", error);
        return NextResponse.json({ error: "服务器内部错误，请稍后重试" }, { status: 500 });
    }
}
