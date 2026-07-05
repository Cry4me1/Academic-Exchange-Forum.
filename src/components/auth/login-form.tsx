"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData, usernameLoginSchema, type UsernameLoginFormData } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, KeyRound, Loader2, Mail, User, Copy, ExternalLink, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("magic-link");

    // 洛谷登录状态
    const [luoguId, setLuoguId] = useState("");
    const [luoguVerifyCode, setLuoguVerifyCode] = useState("");
    const [isLuoguLoading, setIsLuoguLoading] = useState(false);
    const [luoguError, setLuoguError] = useState<string | null>(null);

    useEffect(() => {
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        if (error) {
            setError(errorDescription || "登录验证失败，请重试");
        }
    }, [searchParams]);

    // 邮箱登录表单（magic-link 和 password 共用）
    const {
        register: registerEmail,
        handleSubmit: handleSubmitEmail,
        formState: { errors: emailErrors },
        reset: resetEmail,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    // 用户名登录表单
    const {
        register: registerUsername,
        handleSubmit: handleSubmitUsername,
        formState: { errors: usernameErrors },
        reset: resetUsername,
    } = useForm<UsernameLoginFormData>({
        resolver: zodResolver(usernameLoginSchema),
    });

    // 切换 Tab 时重置表单状态
    const onTabChange = (value: string) => {
        setActiveTab(value);
        setError(null);
        setLuoguError(null);
        resetEmail();
        resetUsername();
        setLuoguId("");
        setLuoguVerifyCode("");
    };

    // 洛谷登录第一步：获取登录验证码
    const handleLuoguInit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!luoguId.trim()) {
            setLuoguError("请输入洛谷 UID");
            return;
        }
        if (isNaN(Number(luoguId.trim()))) {
            setLuoguError("洛谷 UID 必须为纯数字");
            return;
        }

        setIsLuoguLoading(true);
        setLuoguError(null);

        try {
            const res = await fetch("/api/auth/luogu/login/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ luoguId: luoguId.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "获取验证码失败");

            setLuoguVerifyCode(data.verificationCode);
            toast.success("登录验证码生成成功！");
        } catch (err: any) {
            setLuoguError(err.message || "请求出错，请重试");
        } finally {
            setIsLuoguLoading(false);
        }
    };

    // 洛谷登录第二步：验证并登录
    const handleLuoguVerify = async () => {
        setIsLuoguLoading(true);
        setLuoguError(null);

        try {
            const res = await fetch("/api/auth/luogu/login/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ luoguId: luoguId.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "登录验证失败");

            toast.success("验证成功，正在登录...");
            // 重定向至 Supabase 生成的 Magic Link 完成登录会话初始化
            window.location.href = data.actionLink;
        } catch (err: any) {
            setLuoguError(err.message || "登录失败，请重试");
            setIsLuoguLoading(false);
        }
    };

    // 邮箱相关登录（magic-link / password）
    const onEmailSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);
        const supabase = createClient();

        try {
            if (activeTab === "magic-link") {
                // 邮箱链接登录
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

    // 用户名登录
    const onUsernameSubmit = async (data: UsernameLoginFormData) => {
        setIsLoading(true);
        setError(null);
        const supabase = createClient();

        try {
            const pseudoEmail = `${data.username.toLowerCase()}@scholarly.org`;

            const { error: authError } = await supabase.auth.signInWithPassword({
                email: pseudoEmail,
                password: data.password,
            });

            if (authError) {
                setError("用户名或密码错误");
                return;
            }

            router.push("/dashboard");
            router.refresh();
        } catch {
            setError("登录请求出错，请稍后重试");
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

    const gradientButtonClass = "w-full h-11 mt-2 text-white font-semibold border-0 rounded-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 dark:from-amber-500 dark:to-orange-500 dark:hover:from-amber-400 dark:hover:to-orange-400 dark:text-slate-950 dark:shadow-amber-500/25";

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
                <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="magic-link" className="text-xs px-1">邮箱链接</TabsTrigger>
                    <TabsTrigger value="password" className="text-xs px-1">账号密码</TabsTrigger>
                    <TabsTrigger value="username" className="text-xs px-1">用户名</TabsTrigger>
                    <TabsTrigger value="luogu" className="text-xs px-1">洛谷登录</TabsTrigger>
                </TabsList>

                {/* Tab 1: 邮箱链接登录 */}
                <TabsContent value="magic-link" className="space-y-4 mt-0">
                    <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-4">
                        {/* 邮箱输入 */}
                        <div className="space-y-2">
                            <Label htmlFor="magic-email">邮箱地址</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="magic-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    className="pl-10 h-11"
                                    {...registerEmail("email")}
                                />
                            </div>
                            {emailErrors.email && (
                                <p className="text-sm text-destructive">{emailErrors.email.message}</p>
                            )}
                        </div>

                        {/* 错误提示 */}
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                                <Loader2 className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {/* 提交按钮 */}
                        <Button
                            type="submit"
                            className={gradientButtonClass}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    发送中...
                                </>
                            ) : (
                                "发送登录链接"
                            )}
                        </Button>
                    </form>
                </TabsContent>

                {/* Tab 2: 账号密码登录 */}
                <TabsContent value="password" className="space-y-4 mt-0">
                    <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-4">
                        {/* 邮箱输入 */}
                        <div className="space-y-2">
                            <Label htmlFor="pwd-email">邮箱地址</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="pwd-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    className="pl-10 h-11"
                                    {...registerEmail("email")}
                                />
                            </div>
                            {emailErrors.email && (
                                <p className="text-sm text-destructive">{emailErrors.email.message}</p>
                            )}
                        </div>

                        {/* 密码输入 */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="pwd-password">密码</Label>
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
                                    id="pwd-password"
                                    type="password"
                                    placeholder="请输入密码"
                                    className="pl-10 h-11"
                                    {...registerEmail("password")}
                                />
                            </div>
                            {emailErrors.password && (
                                <p className="text-sm text-destructive">{emailErrors.password.message}</p>
                            )}
                        </div>

                        {/* 错误提示 */}
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                                <Loader2 className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {/* 提交按钮 */}
                        <Button
                            type="submit"
                            className={gradientButtonClass}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    登录中...
                                </>
                            ) : (
                                "登录"
                            )}
                        </Button>
                    </form>
                </TabsContent>

                {/* Tab 3: 用户名登录 */}
                <TabsContent value="username" className="space-y-4 mt-0">
                    <form onSubmit={handleSubmitUsername(onUsernameSubmit)} className="space-y-4">
                        {/* 用户名输入 */}
                        <div className="space-y-2">
                            <Label htmlFor="uname-username">用户名</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="uname-username"
                                    type="text"
                                    placeholder="请输入用户名"
                                    className="pl-10 h-11"
                                    {...registerUsername("username")}
                                />
                            </div>
                            {usernameErrors.username && (
                                <p className="text-sm text-destructive">{usernameErrors.username.message}</p>
                            )}
                        </div>

                        {/* 密码输入 */}
                        <div className="space-y-2">
                            <Label htmlFor="uname-password">密码</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="uname-password"
                                    type="password"
                                    placeholder="请输入密码"
                                    className="pl-10 h-11"
                                    {...registerUsername("password")}
                                />
                            </div>
                            {usernameErrors.password && (
                                <p className="text-sm text-destructive">{usernameErrors.password.message}</p>
                            )}
                        </div>

                        {/* 错误提示 */}
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                                <Loader2 className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {/* 提交按钮 */}
                        <Button
                            type="submit"
                            className={gradientButtonClass}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    登录中...
                                </>
                            ) : (
                                "登录"
                            )}
                        </Button>
                    </form>
                </TabsContent>

                {/* Tab 4: 洛谷登录 */}
                <TabsContent value="luogu" className="space-y-4 mt-0">
                    <form onSubmit={handleLuoguInit} className="space-y-4">
                        {/* 洛谷 UID */}
                        <div className="space-y-2">
                            <Label htmlFor="luogu-login-uid">洛谷 UID (纯数字)</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center font-bold text-xs text-red-500 w-4 h-4">
                                    谷
                                </div>
                                <Input
                                    id="luogu-login-uid"
                                    type="text"
                                    placeholder="例如: 384039"
                                    className="pl-10 h-11"
                                    value={luoguId}
                                    onChange={(e) => setLuoguId(e.target.value)}
                                    disabled={isLuoguLoading || !!luoguVerifyCode}
                                />
                            </div>
                        </div>

                        {/* 错误提示 */}
                        {luoguError && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                                <Loader2 className="w-4 h-4 shrink-0" />
                                <span className="leading-snug">{luoguError}</span>
                            </div>
                        )}

                        {/* 如果已生成验证码，显示操作步骤 */}
                        {luoguVerifyCode ? (
                            <div className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-200/50 dark:border-orange-900/30 space-y-3">
                                <h4 className="text-xs font-semibold text-orange-800 dark:text-orange-400 flex items-center gap-1">
                                    <HelpCircle className="h-3.5 w-3.5" />
                                    登录验证步骤：
                                </h4>
                                <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                                    <li className="leading-relaxed">
                                        复制您的专属登录验证码：
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <code className="px-2 py-0.5 rounded bg-background border border-border text-foreground font-mono text-[10px] block flex-1 overflow-x-auto">
                                                {luoguVerifyCode}
                                            </code>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(luoguVerifyCode);
                                                    toast.success("登录验证码已复制");
                                                }}
                                                className="h-6 text-[10px] px-2"
                                            >
                                                复制
                                            </Button>
                                        </div>
                                    </li>
                                    <li className="leading-relaxed">
                                        在
                                        <a
                                            href="https://www.luogu.com.cn/"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary hover:underline font-semibold mx-1"
                                        >
                                            洛谷个人设置
                                        </a>
                                        中，将验证码保存到您的“个人介绍”。
                                    </li>
                                    <li className="leading-relaxed">
                                        完成设置后，点击下方的“验证并登录”。
                                    </li>
                                </ol>

                                <div className="flex gap-2 pt-1">
                                    <Button
                                        type="button"
                                        onClick={handleLuoguVerify}
                                        disabled={isLuoguLoading}
                                        className="flex-1 h-9 text-xs text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 dark:from-amber-500 dark:to-orange-500 dark:text-slate-950"
                                    >
                                        {isLuoguLoading ? (
                                            <>
                                                <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                                验证登录中...
                                            </>
                                        ) : (
                                            "验证并登录"
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setLuoguVerifyCode("");
                                            setLuoguError(null);
                                        }}
                                        className="h-9 text-xs"
                                        disabled={isLuoguLoading}
                                    >
                                        上一步
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            /* 获取验证码按钮 */
                            <Button
                                type="submit"
                                className={gradientButtonClass}
                                disabled={isLuoguLoading}
                            >
                                {isLuoguLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        请求中...
                                    </>
                                ) : (
                                    "获取登录验证码"
                                )}
                            </Button>
                        )}
                    </form>
                </TabsContent>
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
