"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error: authError } = await supabase.auth.signInWithOtp({
                email: data.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
                },
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            setIsSuccess(true);
        } catch {
            setError("发送登录链接时出错，请稍后重试");
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
                    登录链接已发送！
                </h3>
                <p className="text-muted-foreground">
                    请检查您的邮箱，点击链接完成登录。
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 标题 */}
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold text-foreground">欢迎回来</h1>
                <p className="text-muted-foreground">
                    输入邮箱获取登录链接
                </p>
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

            {/* 错误提示 */}
            {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
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
                        发送中...
                    </>
                ) : (
                    "发送登录链接"
                )}
            </Button>

            {/* 注册链接 */}
            <p className="text-center text-sm text-muted-foreground">
                还没有账号？{" "}
                <Link
                    href="/register"
                    className="text-primary hover:underline font-medium"
                >
                    立即注册
                </Link>
            </p>
        </form>
    );
}
