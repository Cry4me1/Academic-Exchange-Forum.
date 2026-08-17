import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { usernameRegisterSchema } from "@/lib/validations/auth";
import { registerLimiter } from "@/lib/rate-limit";

export async function POST(request: Request) {
    try {
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded?.split(",")[0]?.trim() || "unknown";
        const { limited, resetIn } = registerLimiter.check(ip);
        if (limited) {
            return NextResponse.json(
                { error: `注册请求过于频繁，请 ${Math.ceil(resetIn / 60000)} 分钟后重试` },
                { status: 429 }
            );
        }

        const body = await request.json();
        const validated = usernameRegisterSchema.safeParse(body);
        if (!validated.success) {
            return NextResponse.json(
                { error: validated.error.issues[0]?.message || "参数错误" },
                { status: 400 }
            );
        }

        const { username, full_name, password } = validated.data;

        const adminClient = createAdminClient();

        // 1. 检查用户名是否已被注册
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

        // 2. 生成合法的 TLD 虚拟邮箱以绕过 TLD 校验且避免触发验证邮件发送限制
        const pseudoEmail = `${username.toLowerCase()}@scholarly.org`;

        // 3. 在服务端通过 Admin API 注册用户（自动标记 email_confirm 为 true）
        const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
            email: pseudoEmail,
            password: password,
            email_confirm: true,
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
                is_verified: false,
                auth_provider: "username",
            })
            .eq("id", userId);

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
