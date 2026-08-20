"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Settings,
    Shield,
    Ticket,
    Globe,
    Lock,
    Save,
    Loader2,
    Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export function SettingsClient() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [registrationMode, setRegistrationMode] = useState<string>("INVITE_ONLY");

    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch("/api/admin/settings");
                const data = await res.json();
                if (data.settings && data.settings.registration_mode) {
                    setRegistrationMode(data.settings.registration_mode);
                }
            } catch {
                toast.error("获取系统设置失败");
            } finally {
                setIsLoading(false);
            }
        }
        fetchSettings();
    }, []);

    const handleSaveRegistrationMode = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    key: "registration_mode",
                    value: registrationMode,
                    description: "全局注册准入模式设置",
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "保存失败");
                return;
            }
            toast.success("注册模式已成功更新并全局生效！");
        } catch {
            toast.error("网络异常，保存失败");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <span className="text-sm">正在加载全局系统配置...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl pb-12">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                    <Settings className="w-7 h-7 text-slate-600 dark:text-slate-400" />
                    全局系统设置 (Hansszh 专属)
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    配置 Scholarly 学术社区的准入模式与安全策略
                </p>
            </div>

            {/* 注册模式设置卡片 */}
            <Card className="border-border/60 shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-orange-500" />
                            <CardTitle className="text-lg">学者准入与注册模式</CardTitle>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-amber-400 font-medium">
                            即时热生效
                        </span>
                    </div>
                    <CardDescription>
                        选择当前社区面向公众学者的开放程度。修改后前端注册表单与后端鉴权将立即遵从。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <RadioGroup
                        value={registrationMode}
                        onValueChange={setRegistrationMode}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        {/* 模式 1: 严格邀请制 */}
                        <Label
                            htmlFor="mode-invite-only"
                            className={`flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                registrationMode === "INVITE_ONLY"
                                    ? "border-orange-500 bg-orange-500/5 shadow-sm"
                                    : "border-border/60 hover:border-border hover:bg-muted/30"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                        <Ticket className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-foreground text-sm flex items-center gap-1">
                                            严格邀请制
                                        </div>
                                        <div className="text-[11px] text-muted-foreground mt-0.5">
                                            必须凭 Hansszh 邀请码入驻
                                        </div>
                                    </div>
                                </div>
                                <RadioGroupItem value="INVITE_ONLY" id="mode-invite-only" />
                            </div>
                            <p className="text-xs text-muted-foreground/80 mt-3 pt-3 border-t border-border/40">
                                仅持有超级管理员签发的邀请码可注册，严格杜绝机器人与未受邀人员。
                            </p>
                        </Label>

                        {/* 模式 2: 开放注册 */}
                        <Label
                            htmlFor="mode-open"
                            className={`flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                registrationMode === "OPEN"
                                    ? "border-orange-500 bg-orange-500/5 shadow-sm"
                                    : "border-border/60 hover:border-border hover:bg-muted/30"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-foreground text-sm">
                                            开放注册
                                        </div>
                                        <div className="text-[11px] text-muted-foreground mt-0.5">
                                            无需邀请码自由入驻
                                        </div>
                                    </div>
                                </div>
                                <RadioGroupItem value="OPEN" id="mode-open" />
                            </div>
                            <p className="text-xs text-muted-foreground/80 mt-3 pt-3 border-t border-border/40">
                                任何学者均可自由注册账号，邀请码为选填项。
                            </p>
                        </Label>

                        {/* 模式 3: 关闭注册 */}
                        <Label
                            htmlFor="mode-closed"
                            className={`flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                registrationMode === "CLOSED"
                                    ? "border-destructive bg-destructive/5 shadow-sm"
                                    : "border-border/60 hover:border-border hover:bg-muted/30"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-foreground text-sm">
                                            暂停新用户注册
                                        </div>
                                        <div className="text-[11px] text-muted-foreground mt-0.5">
                                            关闭注册通道
                                        </div>
                                    </div>
                                </div>
                                <RadioGroupItem value="CLOSED" id="mode-closed" />
                            </div>
                            <p className="text-xs text-muted-foreground/80 mt-3 pt-3 border-t border-border/40">
                                封闭维护期间使用，所有新注册暂停，已有账号可正常登录。
                            </p>
                        </Label>
                    </RadioGroup>

                    <div className="flex items-center justify-end pt-4 border-t border-border/60">
                        <Button
                            onClick={handleSaveRegistrationMode}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    保存生效中...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    保存设置
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 安全机制提示 */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">
                        Hansszh 超级管理员专属权限受控
                    </p>
                    <p>
                        邀请码的签发、启停及核销追溯严格受数据库 RLS 与后端 RBAC 双重鉴权保护，仅超级管理员账号拥有操作权限。
                    </p>
                </div>
            </div>
        </div>
    );
}
