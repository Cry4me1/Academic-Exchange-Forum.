import { NextResponse } from "next/server";
import { validateInviteCodeServer, getRegistrationMode } from "@/lib/invite/service";
import { RateLimiter } from "@/lib/rate-limit";

// 邀请码防爆破限流器：单 IP 每分钟最多查 30 次
const inviteLimiter = new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const getModeOnly = searchParams.get("getMode") === "true";

        // 获取系统当前注册模式
        const mode = await getRegistrationMode();

        if (getModeOnly) {
            return NextResponse.json({
                registration_mode: mode,
            });
        }

        if (!code) {
            return NextResponse.json({
                valid: false,
                error: "请提供邀请码",
                registration_mode: mode,
            }, { status: 400 });
        }

        // IP 限流检查
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded?.split(",")[0]?.trim() || "unknown";
        const { limited, resetIn } = inviteLimiter.check(ip);
        if (limited) {
            return NextResponse.json({
                valid: false,
                error: `查询过于频繁，请 ${Math.ceil(resetIn / 1000)} 秒后再试`,
                registration_mode: mode,
            }, { status: 429 });
        }

        const result = await validateInviteCodeServer(code);

        return NextResponse.json({
            ...result,
            registration_mode: mode,
        });
    } catch (error: any) {
        console.error("[Invite Validate API] Error:", error);
        return NextResponse.json({
            valid: false,
            error: "校验服务异常",
        }, { status: 500 });
    }
}
