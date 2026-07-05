"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import {
    registerSchema,
    type RegisterFormData,
    usernameRegisterSchema,
    type UsernameRegisterFormData,
} from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, KeyRound, Loader2, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function RegisterForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("email");
    const router = useRouter();

    // 邮箱注册表单
    const {
        register: registerEmail,
        handleSubmit: handleSubmitEmail,
        formState: { errors: emailErrors },
        reset: resetEmail,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    // 用户名注册表单
    const {
        register: registerUsername,
        handleSubmit: handleSubmitUsername,
        formState: { errors: usernameErrors },
        reset: resetUsername,
    } = useForm<UsernameRegisterFormData>({
        resolver: zodResolver(usernameRegisterSchema),
    });

    // 切换 Tab 时重置状态
    const onTabChange = (value: string) => {
        setActiveTab(value);
        setError(null);
        resetEmail();
        resetUsername();
    };

    // 邮箱注册
    const onEmailSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
            const redirectTo = `${siteUrl}/auth/callback?next=/dashboard`;

            console.log("[Auth] Registering user:", data.email);
            console.log("[Auth] Redirect URL:", redirectTo);

            const { error: authError, data: authData } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    emailRedirectTo: redirectTo,
                    data: {
                        username: data.username,
                        full_name: data.full_name,
                    },
                },
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
                setError("该邮箱已被注册，请直接登录");
                return;
            }

            setIsSuccess(true);
            toast.success("注册成功！请检查邮箱完成验证");
        } catch {
            setError("注册时出错，请稍后重试");
        } finally {
            setIsLoading(false);
        }
    };

    // 用户名注册
    const onUsernameSubmit = async (data: UsernameRegisterFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/username/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: data.username,
                    full_name: data.full_name,
                    password: data.password,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error || "注册时出错，请稍后重试");
                return;
            }

            toast.success("注册成功！");
            
            if (result.actionLink) {
                // 如果后端成功返回了一次性登录链接，直接重定向进行登录激活会话
                window.location.href = result.actionLink;
            } else {
                router.push("/login?tab=username&registered=true");
            }
        } catch {
            setError("注册时出错，请稍后重试");
        } finally {
            setIsLoading(false);
        }
    };

    // 邮箱注册成功提示
    if (isSuccess && activeTab === "email") {
        return (
            <div className="text-center space-y-4">
                <div className="inline-flex p-4 rounded-full bg-green-500/10 text-green-500">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                    验证邮件已发送！
                </h3>
                <p className="text-muted-foreground">
                    请检查您的邮箱，点击链接完成注册。
                </p>
                <div className="mt-4">
                    <Link href="/login">
                        <Button variant="outline">前往登录</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const gradientButtonClass = "w-full h-11 text-white font-semibold border-0 rounded-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 dark:from-amber-500 dark:to-orange-500 dark:hover:from-amber-400 dark:hover:to-orange-400 dark:text-slate-950 dark:shadow-amber-500/25";

    return (
        <div className="space-y-6">
            {/* 标题 */}
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold text-foreground">创建账号</h1>
                <p className="text-muted-foreground">
                    加入 Scholarly 学术社区
                </p>
            </div>

            <Tabs defaultValue="email" value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="email">邮箱注册</TabsTrigger>
                    <TabsTrigger value="username">用户名注册</TabsTrigger>
                </TabsList>

                {/* Tab 1: 邮箱注册 */}
                <TabsContent value="email" className="space-y-4 mt-0">
                    <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-4">
                        {/* 用户名输入 */}
                        <div className="space-y-2">
                            <Label htmlFor="email-reg-username">用户名</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email-reg-username"
                                    type="text"
                                    placeholder="请输入用户名"
                                    className="pl-10 h-11"
                                    {...registerEmail("username")}
                                />
                            </div>
                            {emailErrors.username && (
                                <p className="text-sm text-destructive">{emailErrors.username.message}</p>
                            )}
                        </div>

                        {/* 真实姓名 */}
                        <div className="space-y-2">
                            <Label htmlFor="email-reg-full-name">真实姓名</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email-reg-full-name"
                                    type="text"
                                    placeholder="请输入真实姓名"
                                    className="pl-10 h-11"
                                    {...registerEmail("full_name")}
                                />
                            </div>
                            {emailErrors.full_name && (
                                <p className="text-sm text-destructive">{emailErrors.full_name.message}</p>
                            )}
                        </div>

                        {/* 邮箱输入 */}
                        <div className="space-y-2">
                            <Label htmlFor="email-reg-email">邮箱地址</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email-reg-email"
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
                            <Label htmlFor="email-reg-password">密码</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email-reg-password"
                                    type="password"
                                    placeholder="设置登录密码"
                                    className="pl-10 h-11"
                                    {...registerEmail("password")}
                                />
                            </div>
                            {emailErrors.password && (
                                <p className="text-sm text-destructive">{emailErrors.password.message}</p>
                            )}
                        </div>

                        {/* 确认密码输入 */}
                        <div className="space-y-2">
                            <Label htmlFor="email-reg-confirmPassword">确认密码</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email-reg-confirmPassword"
                                    type="password"
                                    placeholder="再次输入密码"
                                    className="pl-10 h-11"
                                    {...registerEmail("confirmPassword")}
                                />
                            </div>
                            {emailErrors.confirmPassword && (
                                <p className="text-sm text-destructive">{emailErrors.confirmPassword.message}</p>
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
                                    注册中...
                                </>
                            ) : (
                                "注册账号"
                            )}
                        </Button>
                    </form>
                </TabsContent>

                {/* Tab 2: 用户名注册 */}
                <TabsContent value="username" className="space-y-4 mt-0">
                    <form onSubmit={handleSubmitUsername(onUsernameSubmit)} className="space-y-4">
                        {/* 用户名输入 */}
                        <div className="space-y-2">
                            <Label htmlFor="uname-reg-username">用户名</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="uname-reg-username"
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

                        {/* 真实姓名 */}
                        <div className="space-y-2">
                            <Label htmlFor="uname-reg-full-name">真实姓名</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="uname-reg-full-name"
                                    type="text"
                                    placeholder="请输入真实姓名"
                                    className="pl-10 h-11"
                                    {...registerUsername("full_name")}
                                />
                            </div>
                            {usernameErrors.full_name && (
                                <p className="text-sm text-destructive">{usernameErrors.full_name.message}</p>
                            )}
                        </div>

                        {/* 密码输入 */}
                        <div className="space-y-2">
                            <Label htmlFor="uname-reg-password">密码</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="uname-reg-password"
                                    type="password"
                                    placeholder="设置登录密码"
                                    className="pl-10 h-11"
                                    {...registerUsername("password")}
                                />
                            </div>
                            {usernameErrors.password && (
                                <p className="text-sm text-destructive">{usernameErrors.password.message}</p>
                            )}
                        </div>

                        {/* 确认密码输入 */}
                        <div className="space-y-2">
                            <Label htmlFor="uname-reg-confirmPassword">确认密码</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="uname-reg-confirmPassword"
                                    type="password"
                                    placeholder="再次输入密码"
                                    className="pl-10 h-11"
                                    {...registerUsername("confirmPassword")}
                                />
                            </div>
                            {usernameErrors.confirmPassword && (
                                <p className="text-sm text-destructive">{usernameErrors.confirmPassword.message}</p>
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
                                    注册中...
                                </>
                            ) : (
                                "注册账号"
                            )}
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>

            {/* 服务条款 */}
            <p className="text-center text-xs text-muted-foreground">
                注册即表示您同意我们的{" "}
                <Link href="#" className="text-orange-500 dark:text-amber-400 hover:underline hover:text-orange-600 dark:hover:text-amber-300 transition-colors">
                    服务条款
                </Link>
                {" "}和{" "}
                <Link href="#" className="text-orange-500 dark:text-amber-400 hover:underline hover:text-orange-600 dark:hover:text-amber-300 transition-colors">
                    隐私政策
                </Link>
            </p>

            {/* 登录链接 */}
            <p className="text-center text-sm text-muted-foreground">
                已有账号？{" "}
                <Link
                    href="/login"
                    className="text-orange-500 dark:text-amber-400 hover:text-orange-600 dark:hover:text-amber-300 hover:underline font-medium transition-colors"
                >
                    立即登录
                </Link>
            </p>
        </div>
    );
}
