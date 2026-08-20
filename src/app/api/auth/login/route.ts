import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsernamePseudoEmail } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { identifier, password } = body;

        if (!identifier || !password) {
            return NextResponse.json(
                { error: "请输入用户名/邮箱以及登录密码" },
                { status: 400 }
            );
        }

        const cleanInput = String(identifier).trim();
        const adminClient = createAdminClient();
        const supabase = await createClient();

        let targetEmail = cleanInput;

        // 1. 如果输入的不含 @，说明用户输入的是用户名
        if (!cleanInput.includes("@")) {
            // 通过 adminClient 查询 profiles 表（不受 RLS 限制）
            const { data: profile } = await adminClient
                .from("profiles")
                .select("email, username")
                .ilike("username", cleanInput)
                .maybeSingle();

            if (profile?.email) {
                targetEmail = profile.email;
            } else {
                targetEmail = getUsernamePseudoEmail(cleanInput);
            }
        } else {
            // 输入包含 @，但是可能用户名的昵称里恰好带了 @，或者直接是邮箱
            // 尝试先按 profiles 的 username 优先匹配，没找到再按真实 email
            const { data: profileByUsername } = await adminClient
                .from("profiles")
                .select("email, username")
                .ilike("username", cleanInput)
                .maybeSingle();

            if (profileByUsername?.email) {
                targetEmail = profileByUsername.email;
            }
        }

        // 2. 尝试登录
        let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: password,
        });

        // 3. 智能兜底重试：如果第一次失败，且用户输入的是用户名，尝试历史备选邮箱格式
        if (authError && !cleanInput.includes("@")) {
            const fallbackEmail = `${cleanInput.toLowerCase()}@scholarly.org`;
            if (fallbackEmail !== targetEmail) {
                const retry = await supabase.auth.signInWithPassword({
                    email: fallbackEmail,
                    password: password,
                });
                if (!retry.error) {
                    authData = retry.data;
                    authError = null;
                }
            }
        }

        if (authError) {
            console.warn("[Login API] Auth failed for:", cleanInput, "Target email:", targetEmail, "Error:", authError.message);
            return NextResponse.json(
                { error: "用户名/邮箱或密码错误，请核对后重试" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            user: authData.user,
            redirectUrl: "/dashboard",
        });

    } catch (error: any) {
        console.error("[Login API] Exception:", error);
        return NextResponse.json(
            { error: "登录服务异常，请稍后重试" },
            { status: 500 }
        );
    }
}
