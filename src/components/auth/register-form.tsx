"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, User, Loader2, CheckCircle, KeyRound, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RegisterForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            // 使用账号密码注册
            const { error: authError, data: authData } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
                    data: {
                        username: data.username,
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

    if (isSuccess) {
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

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 标题 */}
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold text-foreground">创建账号</h1>
                <p className="text-muted-foreground">
                    加入 Scholarly 学术社区
                </p>
            </div>

            {/* 用户名输入 */}
            <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        id="username"
                        type="text"
                        placeholder="请输入用户名"
                        className="pl-10 h-11"
                        {...register("username")}
                    />
                </div>
                {errors.username && (
                    <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
            </div>

            {/* 邮箱输入 */}
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

            {/* 密码输入 */}
            <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        id="password"
                        type="password"
                        placeholder="设置登录密码"
                        className="pl-10 h-11"
                        {...register("password")}
                    />
                </div>
                {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
            </div>

            {/* 确认密码输入 */}
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="再次输入密码"
                        className="pl-10 h-11"
                        {...register("confirmPassword")}
                    />
                </div>
                {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
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
                className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
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

            {/* 服务条款 */}
            <p className="text-center text-xs text-muted-foreground">
                注册即表示您同意我们的{" "}
                <Link href="#" className="text-primary hover:underline">
                    服务条款
                </Link>
                {" "}和{" "}
                <Link href="#" className="text-primary hover:underline">
                    隐私政策
                </Link>
            </p>

            {/* 登录链接 */}
            <p className="text-center text-sm text-muted-foreground">
                已有账号？{" "}
                <Link
                    href="/login"
                    className="text-primary hover:underline font-medium"
                >
                    立即登录
                </Link>
            </p>
        </form>
    );
}
