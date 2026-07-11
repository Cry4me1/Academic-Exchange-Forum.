"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Copy, ExternalLink, HelpCircle, Loader2, RefreshCw, Unlink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface LinkedAccount {
    id: string;
    provider: string;
    provider_user_id: string;
    provider_username: string | null;
    is_verified: boolean;
    linked_at: string;
}

export function LinkedAccountsCard() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [unbinding, setUnbinding] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [luoguAccount, setLuoguAccount] = useState<LinkedAccount | null>(null);

    // 绑定表单状态
    const [luoguId, setLuoguId] = useState("");
    const [verifyCode, setVerifyCode] = useState("");
    const [showManual, setShowManual] = useState(false);
    const [luoguHtml, setLuoguHtml] = useState("");

    const supabase = createClient();

    // 加载绑定状态
    const loadBindings = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserId(user.id);
            // 生成验证码：Scholarly-Verify-前6位UUID
            setVerifyCode(`Scholarly-Verify-${user.id.substring(0, 8)}`);

            const { data, error } = await supabase
                .from("user_oauth_accounts")
                .select("*")
                .eq("user_id", user.id);

            if (error) throw error;

            const luogu = data?.find(item => item.provider === "luogu") || null;
            setLuoguAccount(luogu);
        } catch (error: any) {
            console.error("Failed to load account bindings:", error);
            toast.error("加载账号绑定信息失败");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        loadBindings();
    }, [loadBindings]);

    // 复制验证码
    const handleCopyCode = () => {
        navigator.clipboard.writeText(verifyCode);
        toast.success("验证码已复制到剪贴板");
    };

    // 执行绑定
    const handleBind = async () => {
        if (!luoguId.trim()) {
            toast.error("请输入洛谷 UID");
            return;
        }

        if (isNaN(Number(luoguId.trim()))) {
            toast.error("洛谷 UID 必须为纯数字");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/auth/luogu/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    luoguId: luoguId.trim(),
                    verificationCode: verifyCode,
                    luoguHtml: showManual && luoguHtml.trim() ? luoguHtml.trim() : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "验证失败");
            }

            toast.success(`成功绑定洛谷账号: ${data.username}`);
            setLuoguId("");
            setLuoguHtml("");
            setShowManual(false);
            await loadBindings();
        } catch (error: any) {
            console.error("Bind error:", error);
            toast.error(error.message || "网络请求失败，请稍后重试");
            if (!showManual) {
                setShowManual(true);
            }
        } finally {
            setSubmitting(false);
        }
    };

    // 执行解绑
    const handleUnbind = async () => {
        if (!window.confirm("确定要解除与该洛谷账号的绑定吗？")) return;

        setUnbinding(true);
        try {
            const res = await fetch("/api/auth/luogu/verify?provider=luogu", {
                method: "DELETE",
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "解绑失败");
            }

            toast.success("解绑成功");
            await loadBindings();
        } catch (error: any) {
            console.error("Unbind error:", error);
            toast.error(error.message || "解绑失败，请重试");
        } finally {
            setUnbinding(false);
        }
    };

    if (loading) {
        return (
            <Card className="shadow-lg border-border/30 bg-white/80 backdrop-blur-sm mt-6">
                <CardContent className="py-10 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg border-border/30 bg-white/80 backdrop-blur-sm mt-6">
            <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <span>账号绑定</span>
                </CardTitle>
                <CardDescription>
                    绑定第三方学术或编程平台账号，展示已验证徽章，提升社区声誉。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* 洛谷绑定卡片 */}
                <div className="p-4 rounded-xl border border-border/50 bg-background/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center font-bold text-red-600">
                            谷
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">洛谷 (Luogu)</span>
                                {luoguAccount?.is_verified && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950/30 text-green-600 text-xs font-medium">
                                        <CheckCircle2 className="h-3 w-3" />
                                        已绑定
                                    </span>
                                )}
                            </div>
                            {luoguAccount ? (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    绑定用户: <span className="font-semibold text-foreground">{luoguAccount.provider_username}</span> (UID: {luoguAccount.provider_user_id})
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    暂未绑定。绑定后，用户名旁将显示洛谷认证标识。
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        {luoguAccount ? (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleUnbind}
                                disabled={unbinding}
                            >
                                {unbinding ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                ) : (
                                    <Unlink className="h-4 w-4 mr-1.5" />
                                )}
                                解除绑定
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                {/* HTML Anchor for visual helper */}
                                <a
                                    href="https://www.luogu.com.cn/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground h-9"
                                >
                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                    访问洛谷
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* 如果未绑定，显示引导步骤 */}
                {!luoguAccount && (
                    <div className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-200/50 dark:border-orange-900/30 space-y-4">
                        <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-400 flex items-center gap-1.5">
                            <HelpCircle className="h-4 w-4" />
                            如何完成洛谷账号绑定？
                        </h4>
                        <ol className="text-xs text-muted-foreground space-y-3 list-decimal list-inside pl-1">
                            <li className="leading-relaxed">
                                点击上方
                                <span className="font-semibold mx-1 text-foreground">“复制验证码”</span>
                                按钮复制以下生成的专属验证码：
                                <div className="mt-2 flex items-center gap-2 max-w-md">
                                    <code className="px-2.5 py-1 rounded bg-background border border-border text-foreground font-mono text-[11px] block flex-1 overflow-x-auto">
                                        {verifyCode}
                                    </code>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyCode}
                                        className="h-7 text-[11px] px-2"
                                    >
                                        <Copy className="h-3 w-3 mr-1" />
                                        复制
                                    </Button>
                                </div>
                            </li>
                            <li className="leading-relaxed">
                                打开
                                <a
                                    href="https://www.luogu.com.cn/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline font-semibold mx-1 inline-flex items-center gap-0.5"
                                >
                                    洛谷个人中心
                                    <ExternalLink className="h-3 w-3 inline" />
                                </a>
                                ，将上述验证码粘贴到您的
                                <span className="font-semibold text-foreground">“个人介绍”</span>
                                中，并保存设置。
                            </li>
                            <li className="leading-relaxed">
                                在下方输入您的
                                <span className="font-semibold text-foreground">洛谷 UID</span>
                                （数字，例如：<code className="font-mono text-foreground bg-muted px-1 rounded">123456</code>），点击“验证并绑定”。
                            </li>
                        </ol>

                        <div className="pt-2 border-t border-border/50 max-w-md space-y-3">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="luogu-uid" className="text-xs">洛谷 UID (纯数字)</Label>
                                    {!showManual && (
                                        <button 
                                            type="button" 
                                            onClick={() => setShowManual(true)} 
                                            className="text-[10px] text-muted-foreground hover:text-primary underline"
                                        >
                                            网络受限？尝试手动验证
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        id="luogu-uid"
                                        type="text"
                                        placeholder="例如: 384039"
                                        value={luoguId}
                                        onChange={(e) => setLuoguId(e.target.value)}
                                        className="h-9 text-xs"
                                        disabled={submitting}
                                    />
                                    <Button
                                        onClick={handleBind}
                                        disabled={submitting}
                                        size="sm"
                                        className="h-9 text-xs text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 dark:from-amber-500 dark:to-orange-500 dark:text-slate-950 shrink-0"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                验证中...
                                            </>
                                        ) : (
                                            "验证并绑定"
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {showManual && (
                                <div className="mt-3 p-3 rounded-lg border border-dashed border-orange-300 dark:border-orange-900 bg-orange-50/20 dark:bg-orange-950/5 space-y-2.5">
                                    <div className="text-[11px] text-orange-800 dark:text-orange-400 font-semibold flex items-center justify-between">
                                        <span>🌐 服务器海外连接受限，请使用手动网页源码验证：</span>
                                        <button 
                                            type="button" 
                                            className="text-[9px] underline hover:text-orange-600"
                                            onClick={() => {
                                                setShowManual(false);
                                                setLuoguHtml("");
                                            }}
                                        >
                                            切换为自动模式
                                        </button>
                                    </div>
                                    <ol className="list-decimal list-inside text-[10px] text-muted-foreground space-y-1 leading-relaxed">
                                        <li>
                                            点此打开数据接口（若没填 UID，请先在上方输入）：
                                            <a 
                                                href={`https://www.luogu.com.cn/user/${luoguId.trim() || '1'}?_contentOnly=1`} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="text-primary font-semibold hover:underline inline-flex items-center ml-0.5"
                                            >
                                                打开数据页面
                                                <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                                            </a>
                                        </li>
                                        <li>在打开的网页中<strong>右键选择查看网页源代码</strong> (或按 <kbd className="px-1 rounded bg-muted border text-[9px]">Ctrl+U</kbd>)</li>
                                        <li>按 <kbd className="px-1 rounded bg-muted border text-[9px]">Ctrl+A</kbd> 全选，<kbd className="px-1 rounded bg-muted border text-[9px]">Ctrl+C</kbd> 复制全部代码，并粘贴在下方：</li>
                                    </ol>
                                    <textarea
                                        className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-[10px] font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="请在这里粘贴刚才复制的网页全部源代码..."
                                        value={luoguHtml}
                                        onChange={(e) => setLuoguHtml(e.target.value)}
                                        disabled={submitting}
                                        rows={4}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
