import { NextResponse } from "next/server";
import { generateCaptchaSvg } from "@/lib/captcha";
import { RateLimiter } from "@/lib/rate-limit";

// 验证码获取接口限流：每个 IP 每分钟最多 30 次
const captchaLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
});

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    const { limited, resetIn } = captchaLimiter.check(ip);
    if (limited) {
      return NextResponse.json(
        { error: `请求验证码过于频繁，请等待 ${Math.ceil(resetIn / 1000)} 秒后再试` },
        { status: 429 }
      );
    }

    const captcha = generateCaptchaSvg();

    // 仅返回矢量 SVG 图像与 HMAC 签名 Token，绝不暴露任何明文题目或结果
    return NextResponse.json({
      success: true,
      svg: captcha.svg,
      token: captcha.token,
    });
  } catch (error) {
    console.error("[Captcha API] Error generating captcha:", error);
    return NextResponse.json(
      { error: "生成验证码失败，请稍后重试" },
      { status: 500 }
    );
  }
}
