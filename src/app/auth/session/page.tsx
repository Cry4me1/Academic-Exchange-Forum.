"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function AuthSessionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [statusText, setStatusText] = useState("正在安全建立登录会话，请稍候...");
    const next = searchParams.get("next") || "/dashboard";

    useEffect(() => {
        const supabase = createClient();

        const processSession = async () => {
            try {
                // 给予客户端 SDK 几百毫秒的缓冲时间以解析 URL Hash 写入 Session
                await new Promise((resolve) => setTimeout(resolve, 600));

                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    throw error;
                }

                if (session) {
                    setStatusText("登录会话验证成功，正在进入学术看板...");
                    router.refresh();
                    router.replace(next);
                } else {
                    setStatusText("未检测到有效的会话凭证，正在返回登录...");
                    router.replace("/login?error=auth_failed_no_code");
                }
            } catch (err: any) {
                console.error("[Auth Session Page] Error processing session:", err);
                setStatusText("会话验证失败，正在退回登录页...");
                router.replace(`/login?error=${encodeURIComponent(err.message || "auth_session_failed")}`);
            }
        };

        processSession();
    }, [router, next]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-xl flex flex-col items-center max-w-sm w-full mx-4 space-y-4">
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-950/20 text-orange-500">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Scholarly 学术论坛
                </h3>
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    {statusText}
                </p>
            </div>
        </div>
    );
}

export default function AuthSessionPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-xl flex flex-col items-center max-w-sm w-full mx-4 space-y-4">
                    <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-950/20 text-orange-500">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Scholarly 学术论坛
                    </h3>
                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                        正在加载认证上下文，请稍候...
                    </p>
                </div>
            </div>
        }>
            <AuthSessionContent />
        </Suspense>
    );
}
