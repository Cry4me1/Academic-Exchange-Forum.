import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const { luoguId } = await request.json();

        if (!luoguId || isNaN(Number(luoguId.trim()))) {
            return NextResponse.json({ error: "请输入有效的洛谷 UID (数字)" }, { status: 400 });
        }

        const cleanLuoguId = luoguId.trim();

        // 生成随机的验证码
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        const verificationCode = `Scholarly-Login-${randomString}`;

        // 存储到 HttpOnly cookie 中以防止篡改，设置 10 分钟过期
        const cookieStore = await cookies();
        cookieStore.set(`luogu_login_code_${cleanLuoguId}`, verificationCode, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 600, // 10 minutes
            path: "/",
        });

        return NextResponse.json({ verificationCode });
    } catch (error) {
        console.error("[Luogu Login Init] Error:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}
