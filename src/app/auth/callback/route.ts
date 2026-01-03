import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    if (searchParams.get("error")) {
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        return NextResponse.redirect(`${origin}/login?error=${error}&error_description=${errorDescription}`);
    }

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            console.log("Auth callback success, redirecting to:", `${origin}${next}`);

            // 显式检查用户是否已登录
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            console.log("User check after exchange:", user?.id, userError);

            return NextResponse.redirect(`${origin}${next}`);
        } else {
            console.error("Auth callback error:", error);
            // 重定向并带上具体错误信息
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
        }
    } else {
        console.error("Auth callback missing code");
    }
    // 返回错误页面或重定向到登录
    return NextResponse.redirect(`${origin}/login?error=auth_failed_no_code`);
}
