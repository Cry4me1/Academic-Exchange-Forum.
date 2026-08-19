"use client";

import { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CaptchaInputRef {
    refresh: () => void;
}

interface CaptchaInputProps {
    id?: string;
    label?: string;
    value: string;
    onChange: (value: string) => void;
    onTokenChange: (token: string) => void;
    error?: string;
    disabled?: boolean;
}

export const CaptchaInput = forwardRef<CaptchaInputRef, CaptchaInputProps>(
    (
        {
            id = "captcha-input",
            label = "人机安全验证",
            value,
            onChange,
            onTokenChange,
            error,
            disabled = false,
        },
        ref
    ) => {
        const [svg, setSvg] = useState<string>("");
        const [isLoading, setIsLoading] = useState<boolean>(false);
        const [fetchError, setFetchError] = useState<string | null>(null);

        const fetchCaptcha = useCallback(async () => {
            setIsLoading(true);
            setFetchError(null);
            try {
                const res = await fetch("/api/auth/captcha", {
                    cache: "no-store",
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    setSvg(data.svg);
                    onTokenChange(data.token);
                    // 刷新时清空之前已输入的内容
                    onChange("");
                } else {
                    setFetchError(data.error || "获取验证码失败");
                }
            } catch (err) {
                console.error("Failed to load captcha:", err);
                setFetchError("网络异常，无法加载验证码");
            } finally {
                setIsLoading(false);
            }
        }, [onTokenChange, onChange]);

        useImperativeHandle(ref, () => ({
            refresh: () => {
                fetchCaptcha();
            },
        }));

        useEffect(() => {
            fetchCaptcha();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium">
                        <ShieldCheck className="w-4 h-4 text-orange-500 dark:text-amber-400" />
                        {label}
                    </Label>
                    <span className="text-xs text-muted-foreground">输入图中的计算结果或字符</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* 输入框 */}
                    <div className="relative flex-1">
                        <Input
                            id={id}
                            type="text"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="输入答案"
                            disabled={disabled || isLoading}
                            maxLength={10}
                            autoComplete="off"
                            className="h-11 font-mono uppercase tracking-wider"
                        />
                    </div>

                    {/* 验证码矢量图像容器 */}
                    <div
                        onClick={() => !isLoading && !disabled && fetchCaptcha()}
                        title="点击更换验证码"
                        className="relative h-11 w-[140px] sm:w-[150px] shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-slate-900/90 flex items-center justify-center transition-all hover:opacity-90 active:scale-98 select-none shadow-sm"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
                                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                <span>加载中</span>
                            </div>
                        ) : fetchError ? (
                            <span className="text-xs text-destructive text-center px-1">点击重试</span>
                        ) : svg ? (
                            <div
                                className="w-full h-full flex items-center justify-center pointer-events-none"
                                dangerouslySetInnerHTML={{ __html: svg }}
                            />
                        ) : null}
                    </div>

                    {/* 刷新按钮 */}
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={fetchCaptcha}
                        disabled={disabled || isLoading}
                        className="h-11 w-11 shrink-0 text-muted-foreground hover:text-foreground"
                        title="更换验证码"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-orange-500" : ""}`} />
                    </Button>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {fetchError && !error && <p className="text-xs text-destructive">{fetchError}</p>}
            </div>
        );
    }
);

CaptchaInput.displayName = "CaptchaInput";
