import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 游客可访问的公开路由（不需要登录）
const PUBLIC_ROUTES = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/pending-verification",
    "/auth/callback",
    "/updates",
];

// 使用前缀匹配的公开路由
const PUBLIC_PREFIXES = [
    "/api/",  // API 路由自行处理认证
];

// 动态公开路由匹配模式
function isPublicRoute(pathname: string): boolean {
    // 精确匹配
    if (PUBLIC_ROUTES.includes(pathname)) return true;

    // 前缀匹配
    if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) return true;

    // (public) 路由组的路由 — 帖子公开预览等
    // Next.js 的 (public) 路由组在 URL 中不体现，路径直接是 /posts/[id]
    // 但我们使用 (public) 路由组，所以 /posts/[id] 会先被 (public) 匹配
    // 这里不需要特殊处理，因为 (public) 和 (protected) 都有 posts/[id]
    // Next.js 会按路由组的 layout 来决定

    return false;
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // refreshing the auth token
    const { data: { user } } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // 已登录用户访问登录/注册页面时，重定向到 dashboard
    if (user && (pathname === "/login" || pathname === "/register")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
