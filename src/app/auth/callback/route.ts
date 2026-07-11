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
        console.warn("Auth callback missing code, returning HTML fallback for hash token extraction");
        
        const html = `
<!DOCTYPE html>
<html>
<head>
  <title>正在登录...</title>
  <meta charset="utf-8">
  <script>
    window.onload = function() {
      const hash = window.location.hash;
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const next = params.get('next') || '/dashboard';
      
      if (hash && (hash.includes('access_token=') || hash.includes('error='))) {
        // 如果包含凭证或错误，携带 Hash 重定向到目标页面，让前端 Supabase 客户端自行处理登录
        window.location.replace(window.location.origin + next + hash);
      } else {
        window.location.replace(window.location.origin + '/login?error=auth_failed_no_code');
      }
    }
  </script>
</head>
<body style="margin:0;padding:0;background:#f9fafb;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="border: 3px solid #e5e7eb; border-top: 3px solid #f97316; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
  <p style="color:#4b5563; font-size:14px; margin:0;">正在安全建立登录会话，请稍候...</p>
  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</body>
</html>
        `;

        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            },
        });
    }
}
