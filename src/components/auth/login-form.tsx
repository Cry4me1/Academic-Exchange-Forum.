"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, KeyRound, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("magic-link");

    useEffect(() => {
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        if (error) {
            setError(errorDescription || "登录验证失败，请重试");
        }
    }, [searchParams]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    // 切换 Tab 时重置表单状态
    const onTabChange = (value: string) => {
        setActiveTab(value);
        setError(null);
        reset();
    };

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);
        const supabase = createClient();

        try {
            if (activeTab === "magic-link") {
                // 邮箱链接登录
                // 优先使用环境变量中的站点URL，否则使用当前页面origin
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
                const redirectTo = `${siteUrl}/auth/callback?next=/dashboard`;

                console.log("[Auth] Sending magic link to:", data.email);
                console.log("[Auth] Redirect URL:", redirectTo);

                const { error: authError } = await supabase.auth.signInWithOtp({
                    email: data.email,
                    options: {
                        emailRedirectTo: redirectTo,
                    },
                });

                if (authError) {
                    console.error("[Auth] Magic link error:", authError);
                    throw authError;
                }
                console.log("[Auth] Magic link sent successfully");
                setIsSuccess(true);
            } else {
                // 密码登录
                if (!data.password) {
                    setError("请输入密码");
                    setIsLoading(false);
                    return;
                }

                const { error: authError } = await supabase.auth.signInWithPassword({
                    email: data.email,
                    password: data.password,
                });

                if (authError) throw authError;

                // 登录成功跳转
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || "登录请求出错，请稍后重试");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess && activeTab === "magic-link") {
        return (
            <div className="text-center space-y-4">
                <div className="inline-flex p-4 rounded-full bg-green-500/10 text-green-500">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                    登录链接已发送！
                </h3>
                <p className="text-muted-foreground">
                    请检查您的邮箱，点击链接完成登录。
                </p>
                <Button
                    variant="outline"
                    onClick={() => setIsSuccess(false)}
                    className="mt-4"
                >
                    返回登录页
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 标题 */}
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold text-foreground">欢迎回来</h1>
                <p className="text-muted-foreground">
                    登录您的 Scholarly 账号
                </p>
            </div>

            <Tabs defaultValue="magic-link" value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="magic-link">邮箱链接</TabsTrigger>
                    <TabsTrigger value="password">账号密码</TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* 邮箱输入 (两个 Tab 共用) */}
                    <div className="space-y-2">
                        <Label htmlFor="email">邮箱地址</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                className="pl-10 h-11"
                                {...register("email")}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                    </div>

                    <TabsContent value="password" className="space-y-4 mt-0">
                        {/* 密码输入 */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">密码</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-muted-foreground hover:text-orange-500 dark:hover:text-amber-400 hover:underline transition-colors"
                                >
                                    忘记密码？
                                </Link>
                            </div>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="请输入密码"
                                    className="pl-10 h-11"
                                    {...register("password")}
                                />
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="magic-link" className="mt-0">
                        {/* Magic Link 特定说明，这里暂时留空，因为表单主体是一样的 */}
                    </TabsContent>

                    {/* 错误提示 */}
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4" /> {/* 使用通用图标代替 AlertIcon */}
                            {error}
                        </div>
                    )}

                    {/* 提交按钮 */}
                    <Button
                        type="submit"
                        className="w-full h-11 mt-2 text-white font-semibold border-0 rounded-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 dark:from-amber-500 dark:to-orange-500 dark:hover:from-amber-400 dark:hover:to-orange-400 dark:text-slate-950 dark:shadow-amber-500/25"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                {activeTab === "magic-link" ? "发送中..." : "登录中..."}
                            </>
                        ) : (
                            activeTab === "magic-link" ? "发送登录链接" : "登录"
                        )}
                    </Button>
                </form>
            </Tabs>

            {/* 注册链接 */}
            <p className="text-center text-sm text-muted-foreground">
                还没有账号？{" "}
                <Link
                    href="/register"
                    className="text-orange-500 dark:text-amber-400 hover:text-orange-600 dark:hover:text-amber-300 hover:underline font-medium transition-colors"
                >
                    立即注册
                </Link>
            </p>
        </div>
    );
}
