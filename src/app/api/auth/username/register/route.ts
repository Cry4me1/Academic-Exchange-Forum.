import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { usernameRegisterSchema } from "@/lib/validations/auth";
import { registerLimiter } from "@/lib/rate-limit";
import { verifyCaptcha } from "@/lib/captcha";
import {
    getRegistrationMode,
    validateInviteCodeServer,
    consumeInviteCodeServer,
} from "@/lib/invite/service";
import { getUsernamePseudoEmail } from "@/lib/auth-utils";

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
            console.warn(`[Bot Detected] Honeypot triggered on username register from IP: ${ip}`);
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
        const validated = usernameRegisterSchema.safeParse(body);
        if (!validated.success) {
            return NextResponse.json(
                { error: validated.error.issues[0]?.message || "参数错误" },
                { status: 400 }
            );
        }

        const { username, password, captchaToken, captchaCode, inviteCode } = validated.data;

        // 5. 注册策略判定 (严格邀请制)
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
                    { error: "当前社区处于邀请制研讨阶段，用户名注册请输入学术邀请码" },
                    { status: 400 }
                );
            }
        }

        // 预检邀请码有效性
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

        // 8. 生成合法的 ASCII 虚拟邮箱 (完美兼容中英文用户名)
        const pseudoEmail = getUsernamePseudoEmail(username);

        // 9. 在服务端通过 Admin API 注册用户
        const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
            email: pseudoEmail,
            password: password,
            email_confirm: true,
            user_metadata: {
                username: username,
                auth_provider: "username",
                invite_code: trimmedInviteCode || undefined,
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

        // 强更新 profile 确保 username、email 与 metadata 完全一致
        await adminClient
            .from("profiles")
            .update({
                username: username,
                email: pseudoEmail,
                is_verified: false,
                auth_provider: "username",
            })
            .eq("id", userId);

        // 10. 原子核销邀请码
        if (trimmedInviteCode) {
            const consumeRes = await consumeInviteCodeServer({
                code: trimmedInviteCode,
                userId: userId,
                username: username,
                email: pseudoEmail,
                ip: ip,
                userAgent: userAgent,
            });

            if (!consumeRes.success) {
                console.warn(`[Username Register API] Consume invite code warning for user ${userId}:`, consumeRes.error);
            }
        }

        return NextResponse.json({
            success: true,
            needManualLogin: true,
            message: "注册成功！请使用刚刚注册的账号进行登录。"
        });

    } catch (error: any) {
        console.error("[Username Register API] Error:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}
