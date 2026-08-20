"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    registerSchema,
    type RegisterFormData,
    usernameRegisterSchema,
    type UsernameRegisterFormData,
} from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    CheckCircle2,
    KeyRound,
    Loader2,
    Lock,
    Mail,
    User,
    AlertCircle,
    Ticket,
    Sparkles,
    Check,
    GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { CaptchaInput, type CaptchaInputRef } from "./captcha-input";

interface InviteCheckState {
    status: "idle" | "checking" | "valid" | "invalid";
    message?: string;
    inviterName?: string;
    rewardCredits?: number;
}

export function RegisterForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("email");
    const [renderedAt, setRenderedAt] = useState<number>(Date.now());
    const [registrationMode, setRegistrationMode] = useState<string>("INVITE_ONLY");
    const [inviteCheck, setInviteCheck] = useState<InviteCheckState>({ status: "idle" });

    const emailCaptchaRef = useRef<CaptchaInputRef>(null);
    const usernameCaptchaRef = useRef<CaptchaInputRef>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const initialInviteCode = searchParams.get("invite") || searchParams.get("ref") || "";

    // 邮箱注册表单
    const {
        register: registerEmail,
        handleSubmit: handleSubmitEmail,
        control: controlEmail,
        setValue: setValueEmail,
        watch: watchEmail,
        formState: { errors: emailErrors },
        reset: resetEmail,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "",
            full_name: "",
            email: "",
            password: "",
            confirmPassword: "",
            captchaCode: "",
            captchaToken: "",
            inviteCode: initialInviteCode,
            honeypot: "",
            renderedAt: Date.now(),
        },
    });

    // 用户名注册表单
    const {
        register: registerUsername,
        handleSubmit: handleSubmitUsername,
        control: controlUsername,
        setValue: setValueUsername,
        watch: watchUsername,
        formState: { errors: usernameErrors },
        reset: resetUsername,
    } = useForm<UsernameRegisterFormData>({
        resolver: zodResolver(usernameRegisterSchema),
        defaultValues: {
            username: "",
            full_name: "",
            password: "",
            confirmPassword: "",
            captchaCode: "",
            captchaToken: "",
            inviteCode: initialInviteCode,
            honeypot: "",
            renderedAt: Date.now(),
        },
    });

    // 实时监测邀请码输入并防抖校验
    const checkInviteCode = useCallback(async (code: string) => {
        const clean = code.trim().toUpperCase();
        if (!clean) {
            setInviteCheck({ status: "idle" });
            return;
        }

        setInviteCheck({ status: "checking" });

        try {
            const res = await fetch(`/api/auth/invite/validate?code=${encodeURIComponent(clean)}`);
            const data = await res.json();

            if (data.valid) {
                setInviteCheck({
                    status: "valid",
                    message: data.note || "学术邀请码有效",
                    inviterName: data.inviter_name,
                    rewardCredits: data.reward_credits,
                });
            } else {
                setInviteCheck({
                    status: "invalid",
                    message: data.error || "邀请码无效或已失效",
                });
            }
        } catch {
            setInviteCheck({
                status: "invalid",
                message: "邀请码校验网络异常",
            });
        }
    }, []);

    // 监听邀请码变化
    const emailInviteCodeWatch = watchEmail("inviteCode");
    const usernameInviteCodeWatch = watchUsername("inviteCode");
    const currentInviteInput = activeTab === "email" ? emailInviteCodeWatch : usernameInviteCodeWatch;

    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (currentInviteInput) {
            debounceTimerRef.current = setTimeout(() => {
                checkInviteCode(currentInviteInput);
            }, 450);
        } else {
            setInviteCheck({ status: "idle" });
        }

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [currentInviteInput, checkInviteCode, activeTab]);

    // 初始化：获取系统当前注册策略，若带入初始 invite 则校验
    useEffect(() => {
        setRenderedAt(Date.now());

        async function fetchMode() {
            try {
                const res = await fetch("/api/auth/invite/validate?getMode=true");
                const data = await res.json();
                if (data.registration_mode) {
                    setRegistrationMode(data.registration_mode);
                }
            } catch (e) {
                console.error("Fetch reg mode error:", e);
            }
        }

        fetchMode();

        if (initialInviteCode) {
            checkInviteCode(initialInviteCode);
        }
    }, [initialInviteCode, checkInviteCode]);

    // 切换 Tab 时重置状态并同步已填写的邀请码
    const onTabChange = (value: string) => {
        setActiveTab(value);
        setError(null);
        const currentCode = (activeTab === "email" ? emailInviteCodeWatch : usernameInviteCodeWatch) || initialInviteCode;
        if (value === "email") {
            setValueEmail("inviteCode", currentCode);
        } else {
            setValueUsername("inviteCode", currentCode);
        }
        setRenderedAt(Date.now());
    };

    // 邮箱注册提交
    const onEmailSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/email/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: data.username,
                    full_name: data.full_name,
                    email: data.email,
                    password: data.password,
                    confirmPassword: data.confirmPassword,
                    captchaCode: data.captchaCode,
                    captchaToken: data.captchaToken,
                    inviteCode: data.inviteCode?.trim(),
                    honeypot: data.honeypot,
                    renderedAt: renderedAt,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error || "注册失败，请检查填写内容");
                emailCaptchaRef.current?.refresh();
                setValueEmail("captchaCode", "");
                return;
            }

            setIsSuccess(true);
            toast.success("注册成功！请检查邮箱完成验证");
        } catch {
            setError("网络异常，请稍后重试");
            emailCaptchaRef.current?.refresh();
            setValueEmail("captchaCode", "");
        } finally {
            setIsLoading(false);
        }
    };

    // 用户名注册提交
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
                    confirmPassword: data.confirmPassword,
                    captchaCode: data.captchaCode,
                    captchaToken: data.captchaToken,
                    inviteCode: data.inviteCode?.trim(),
                    honeypot: data.honeypot,
                    renderedAt: renderedAt,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error || "注册时出错，请稍后重试");
                usernameCaptchaRef.current?.refresh();
                setValueUsername("captchaCode", "");
                return;
            }

            toast.success("注册成功！");

            if (result.actionLink) {
                window.location.href = result.actionLink;
            } else {
                router.push("/login?tab=username&registered=true");
            }
        } catch {
            setError("网络异常，请稍后重试");
            usernameCaptchaRef.current?.refresh();
            setValueUsername("captchaCode", "");
        } finally {
            setIsLoading(false);
        }
    };

    // 邮箱注册成功提示
    if (isSuccess && activeTab === "email") {
        return (
            <div className="text-center space-y-4">
                <div className="inline-flex p-4 rounded-full bg-green-500/10 text-green-500">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                    验证邮件已发送！
                </h3>
                <p className="text-muted-foreground">
                    请检查您的邮箱，点击验证链接完成账号激活。
                </p>
                <div className="mt-4">
                    <Link href="/login">
                        <Button variant="outline">前往登录</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // 关闭注册提示
    if (registrationMode === "CLOSED") {
        return (
            <div className="text-center space-y-4 py-8">
                <div className="inline-flex p-4 rounded-full bg-amber-500/10 text-amber-500">
                    <GraduationCap className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">社区封闭研讨中</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Scholarly 学术论坛当前正处于内测封闭研讨阶段，新用户注册通道暂时关闭。请关注后续开放公告。
                </p>
                <div className="pt-2">
                    <Link href="/login">
                        <Button variant="outline" className="w-full">返回已有账号登录</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const gradientButtonClass =
        "w-full h-11 text-white font-semibold border-0 rounded-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 dark:from-amber-500 dark:to-orange-500 dark:hover:from-amber-400 dark:hover:to-orange-400 dark:text-slate-950 dark:shadow-amber-500/25";

    const isInviteMandatory = registrationMode === "INVITE_ONLY" || (registrationMode === "INVITE_OR_EDU" && activeTab === "username");

    return (
        <div className="space-y-6">
            {/* 标题与学术邀请制徽章 */}
            <div className="space-y-2 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-amber-400 border border-orange-500/20 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                        {registrationMode === "INVITE_ONLY"
                            ? "受邀同行封闭研讨 · 邀请制入驻"
                            : registrationMode === "INVITE_OR_EDU"
                            ? "高校/科研机构直通 · 或凭邀请码入驻"
                            : "Scholarly 学术学者社区"}
                    </span>
                </div>
                <h1 className="text-2xl font-bold text-foreground">加入学术社区</h1>
                <p className="text-sm text-muted-foreground">
                    与顶尖学者探讨前沿命题，参与学术决斗与同行评审
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
                        {/* 蜜罐陷阱 (Honeypot) */}
                        <div className="hidden pointer-events-none opacity-0 select-none" aria-hidden="true">
                            <input
                                type="text"
                                tabIndex={-1}
                                autoComplete="off"
                                {...registerEmail("honeypot")}
                            />
                        </div>

                        {/* 学术邀请码输入 */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="email-reg-invite" className="flex items-center gap-1.5 font-medium">
                                    <Ticket className="w-4 h-4 text-orange-500 dark:text-amber-400" />
                                    <span>学术邀请码</span>
                                    {isInviteMandatory ? (
                                        <span className="text-destructive text-xs font-normal">* 必填</span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground font-normal">(高校邮箱可免填)</span>
                                    )}
                                </Label>
                            </div>
                            <div className="relative">
                                <Input
                                    id="email-reg-invite"
                                    type="text"
                                    placeholder={
                                        registrationMode === "INVITE_OR_EDU"
                                            ? "如 SCHOLAR-2026-AI (.edu 邮箱可免填)"
                                            : "请输入 8-16 位学术邀请码"
                                    }
                                    className={`uppercase font-mono tracking-wider h-11 pr-10 ${
                                        inviteCheck.status === "valid"
                                            ? "border-green-500/60 focus-visible:ring-green-500"
                                            : inviteCheck.status === "invalid"
                                            ? "border-destructive/60 focus-visible:ring-destructive"
                                            : ""
                                    }`}
                                    {...registerEmail("inviteCode")}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                    {inviteCheck.status === "checking" && (
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    )}
                                    {inviteCheck.status === "valid" && (
                                        <Check className="w-4 h-4 text-green-500" />
                                    )}
                                    {inviteCheck.status === "invalid" && (
                                        <AlertCircle className="w-4 h-4 text-destructive" />
                                    )}
                                </div>
                            </div>
                            {/* 邀请码状态反馈卡片 */}
                            {inviteCheck.status === "valid" && (
                                <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-700 dark:text-green-300 flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
                                    <div>
                                        <p className="font-semibold">
                                            引荐人：{inviteCheck.inviterName || "Hansszh 超级管理员"}
                                        </p>
                                        <p className="text-green-600/80 dark:text-green-400/80 text-[11px] mt-0.5">
                                            学术受邀码有效，欢迎入驻 Scholarly
                                        </p>
                                    </div>
                                </div>
                            )}
                            {inviteCheck.status === "invalid" && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {inviteCheck.message}
                                </p>
                            )}
                        </div>

                        {/* 用户名输入 */}
                        <div className="space-y-2">
                            <Label htmlFor="email-reg-username">学者用户名</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email-reg-username"
                                    type="text"
                                    placeholder="设置英文或中文学者标识"
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
                            <Label htmlFor="email-reg-full-name">学者真实姓名 / 署名</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email-reg-full-name"
                                    type="text"
                                    placeholder="如：张明 (Prof. Zhang)"
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
                            <Label htmlFor="email-reg-email">学术 / 个人邮箱</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email-reg-email"
                                    type="email"
                                    placeholder="your.name@university.edu"
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
                            <Label htmlFor="email-reg-password">登录密码</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email-reg-password"
                                    type="password"
                                    placeholder="设置登录密码（至少6位）"
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

                        {/* 人机安全验证 */}
                        <Controller
                            name="captchaCode"
                            control={controlEmail}
                            render={({ field }) => (
                                <CaptchaInput
                                    ref={emailCaptchaRef}
                                    id="email-captcha-code"
                                    label="人机安全验证"
                                    value={field.value || ""}
                                    onChange={(val) => field.onChange(val)}
                                    onTokenChange={(token) => setValueEmail("captchaToken", token)}
                                    error={emailErrors.captchaCode?.message || emailErrors.captchaToken?.message}
                                    disabled={isLoading}
                                />
                            )}
                        />

                        {/* 错误提示 */}
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
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
                                    学术身份核验中...
                                </>
                            ) : (
                                "完成受邀入驻"
                            )}
                        </Button>
                    </form>
                </TabsContent>

                {/* Tab 2: 用户名注册 */}
                <TabsContent value="username" className="space-y-4 mt-0">
                    <form onSubmit={handleSubmitUsername(onUsernameSubmit)} className="space-y-4">
                        {/* 蜜罐陷阱 (Honeypot) */}
                        <div className="hidden pointer-events-none opacity-0 select-none" aria-hidden="true">
                            <input
                                type="text"
                                tabIndex={-1}
                                autoComplete="off"
                                {...registerUsername("honeypot")}
                            />
                        </div>

                        {/* 学术邀请码输入 */}
                        <div className="space-y-2">
                            <Label htmlFor="uname-reg-invite" className="flex items-center gap-1.5 font-medium">
                                <Ticket className="w-4 h-4 text-orange-500 dark:text-amber-400" />
                                <span>学术邀请码</span>
                                <span className="text-destructive text-xs font-normal">* 必填</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="uname-reg-invite"
                                    type="text"
                                    placeholder="请输入 8-16 位学术邀请码"
                                    className={`uppercase font-mono tracking-wider h-11 pr-10 ${
                                        inviteCheck.status === "valid"
                                            ? "border-green-500/60 focus-visible:ring-green-500"
                                            : inviteCheck.status === "invalid"
                                            ? "border-destructive/60 focus-visible:ring-destructive"
                                            : ""
                                    }`}
                                    {...registerUsername("inviteCode")}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                    {inviteCheck.status === "checking" && (
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    )}
                                    {inviteCheck.status === "valid" && (
                                        <Check className="w-4 h-4 text-green-500" />
                                    )}
                                    {inviteCheck.status === "invalid" && (
                                        <AlertCircle className="w-4 h-4 text-destructive" />
                                    )}
                                </div>
                            </div>
                            {inviteCheck.status === "valid" && (
                                <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-700 dark:text-green-300 flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
                                    <div>
                                        <p className="font-semibold">
                                            引荐人：{inviteCheck.inviterName || "Hansszh 超级管理员"}
                                        </p>
                                        <p className="text-green-600/80 dark:text-green-400/80 text-[11px] mt-0.5">
                                            学术受邀码有效，欢迎入驻 Scholarly
                                        </p>
                                    </div>
                                </div>
                            )}
                            {inviteCheck.status === "invalid" && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {inviteCheck.message}
                                </p>
                            )}
                        </div>

                        {/* 用户名输入 */}
                        <div className="space-y-2">
                            <Label htmlFor="uname-reg-username">学者用户名</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="uname-reg-username"
                                    type="text"
                                    placeholder="设置英文或中文学者标识"
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
                            <Label htmlFor="uname-reg-full-name">学者真实姓名 / 署名</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="uname-reg-full-name"
                                    type="text"
                                    placeholder="如：张明 (Prof. Zhang)"
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
                            <Label htmlFor="uname-reg-password">设置密码</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="uname-reg-password"
                                    type="password"
                                    placeholder="设置登录密码（至少6位）"
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

                        {/* 人机安全验证 */}
                        <Controller
                            name="captchaCode"
                            control={controlUsername}
                            render={({ field }) => (
                                <CaptchaInput
                                    ref={usernameCaptchaRef}
                                    id="username-captcha-code"
                                    label="人机安全验证"
                                    value={field.value || ""}
                                    onChange={(val) => field.onChange(val)}
                                    onTokenChange={(token) => setValueUsername("captchaToken", token)}
                                    error={usernameErrors.captchaCode?.message || usernameErrors.captchaToken?.message}
                                    disabled={isLoading}
                                />
                            )}
                        />

                        {/* 错误提示 */}
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
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
                                    学术身份核验中...
                                </>
                            ) : (
                                "受邀立即入驻"
                            )}
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>

            {/* 服务条款 */}
            <p className="text-center text-xs text-muted-foreground">
                受邀注册即表示您同意恪守本站{" "}
                <Link href="/rules?tab=terms" target="_blank" className="text-orange-500 dark:text-amber-400 hover:underline font-medium">
                    用户协议与隐私条款
                </Link>
                {" "}与{" "}
                <Link href="/rules?tab=guidelines" target="_blank" className="text-orange-500 dark:text-amber-400 hover:underline font-medium">
                    社区公约
                </Link>
            </p>

            {/* 登录链接 */}
            <p className="text-center text-sm text-muted-foreground">
                已拥有学者账号？{" "}
                <Link
                    href="/login"
                    className="text-orange-500 dark:text-amber-400 hover:text-orange-600 dark:hover:text-amber-300 hover:underline font-medium transition-colors"
                >
                    直接登录
                </Link>
            </p>
        </div>
    );
}
