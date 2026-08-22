"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    ShieldCheck,
    ScrollText,
    Clock,
    ImageIcon,
    Scale,
    FileText,
    ArrowRight,
    Loader2,
    ShieldAlert,
    Database,
    MessageSquare,
    UserCheck,
    Gavel,
    Shield,
    HeartHandshake,
    AlertTriangle,
    Ban,
    FileCheck,
    Sparkles,
    ExternalLink,
} from "lucide-react";
import { recordTermsAcceptance } from "@/actions/onboarding";
import { toast } from "sonner";
import Link from "next/link";

interface Step1GuidelinesProps {
    onNext: () => void;
}

export function Step1Guidelines({ onNext }: Step1GuidelinesProps) {
    const [currentTab, setCurrentTab] = useState<string>("terms");
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!agreed) {
            toast.error("请先阅读并勾选同意社区公约与服务协议");
            return;
        }

        setSubmitting(true);
        try {
            const res = await recordTermsAcceptance();
            if (!res.success) {
                toast.error(res.error || "公约签署失败，请重试");
                return;
            }
            toast.success("公约签署成功，进入下一步");
            onNext();
        } catch (err: any) {
            console.error("公约提交失败:", err);
            toast.error("网络连接异常，请重试");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* 头部介绍 */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-semibold text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    第一步 · 社区法律文件与行为公约（强制研读）
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    阅读并签署《Scholarly 学者公约与服务协议》
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Scholarly 致力于打造专业、严谨、开放且合规的学术交流共同体。请学者在下方完整阅读两项基本准则。
                </p>
            </div>

            {/* 核心公约条款嵌入容器（直接内嵌完整 /rules 体系） */}
            <Card className="border-border/70 bg-card/85 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1 border-primary/30 text-primary py-0.5 px-2.5">
                                <Sparkles className="w-3 h-3" />
                                法律文件 & 行为公约 v2026.1
                            </Badge>
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                                · 请切换 Tab 仔细查阅完整条款
                            </span>
                        </div>

                        {/* 独立打开 /rules */}
                        <Link
                            href="/rules"
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium self-end sm:self-auto"
                        >
                            在新窗口打开 (/rules)
                            <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>

                    {/* 双 Tab 切换 */}
                    <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full pt-2">
                        <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/60 border border-border/50 rounded-xl h-auto">
                            <TabsTrigger
                                value="terms"
                                className="py-2 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all"
                            >
                                <ScrollText className="w-4 h-4 text-primary" />
                                <span>📜 用户协议（法律文件）</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="guidelines"
                                className="py-2 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all"
                            >
                                <HeartHandshake className="w-4 h-4 text-emerald-500" />
                                <span>📋 社区公约（行为准则）</span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>

                <CardContent className="p-0">
                    <ScrollArea className="h-[420px] p-5 text-sm text-foreground/90">
                        {currentTab === "terms" && (
                            <div className="space-y-4">
                                {/* 协议性质说明 */}
                                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-3">
                                    <FileCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <div className="text-xs sm:text-sm">
                                        <p className="font-semibold text-foreground">协议性质说明</p>
                                        <p className="text-muted-foreground mt-0.5">
                                            本协议为您与 Scholarly 平台之间具有法律效力的服务合同。注册、登录或使用本平台即代表您已完整阅读并同意受本协议所有条款约束。
                                        </p>
                                    </div>
                                </div>

                                {/* 1. 免责声明 */}
                                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                                            <Scale className="w-4 h-4" />
                                        </div>
                                        <span>第一条：免责声明</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 font-medium text-amber-800 dark:text-amber-300 text-xs">
                                        “本站为个人学术兴趣交流平台，内容由用户自行发布，不代表本站立场”
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        1.1 Scholarly 平台为广大研学者提供学术讨论、代码分享、文献解读与同行评审的技术载体与信息存储空间服务。
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        1.2 用户在平台发表的所有文章、评论、公式、数据及观点，均属发布者个人行为，并不代表本平台立场。平台不对用户发布内容的准确性、完整性、学术有效性或适用性作任何明示或暗示的担保。
                                    </p>
                                </div>

                                {/* 2. 数据留存说明 */}
                                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                                            <Database className="w-4 h-4" />
                                        </div>
                                        <span>第二条：数据留存说明（核心政策）</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 font-medium text-blue-800 dark:text-blue-300 text-xs">
                                        “文字消息永久保存，文件7天后自动删除”
                                    </div>
                                    <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
                                        <div className="p-3 rounded-lg border border-border/50 bg-background/50 space-y-1">
                                            <h5 className="font-medium text-xs text-foreground flex items-center gap-1.5">
                                                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                                                文字记录持久化
                                            </h5>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                文字消息记录将被永久保存，用于保障社区学术脉络可追溯、防范学术不端与合规纠纷处理。
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border/50 bg-background/50 space-y-1">
                                            <h5 className="font-medium text-xs text-foreground flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                                文件7天自动销毁
                                            </h5>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                上传的临时文件、私信附件将在 7 天后由后台系统自动执行物理清理，请学者及时做好本地备份。
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. 用户义务与多媒体责任 */}
                                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                                            <FileCheck className="w-4 h-4" />
                                        </div>
                                        <span>第三条：用户义务与图片责任</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-medium text-emerald-800 dark:text-emerald-300 text-xs">
                                        “严禁发布违法违规内容，图片/附件责任独立自负”
                                    </div>
                                    <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground leading-relaxed pl-1">
                                        <li>
                                            <strong>合法守规：</strong>严格遵守法律法规，严禁发布涉密、涉黄、暴恐及政治敏感信息。
                                        </li>
                                        <li>
                                            <strong>图片版权自负：</strong><strong>用户对所上传的所有图片、论文图表、插图承担完全内容责任与版权责任</strong>。严禁盗用他人成果。
                                        </li>
                                        <li>
                                            <strong>网络安全：</strong>严禁利用漏洞攻击系统、恶意注入脚本或干扰服务器运行。
                                        </li>
                                    </ul>
                                </div>

                                {/* 4. 账号管理与平台处置权利 */}
                                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600">
                                            <UserCheck className="w-4 h-4" />
                                        </div>
                                        <span>第四条：账号责任与违规处置</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        用户对个人账号下的一切行为承担全部责任。对于违规行为，平台有权采取包括但不限于<strong>警告、下架内容、限制发帖、扣除积分、暂时禁言、永久封禁账号</strong>等处置措施。
                                    </p>
                                </div>
                            </div>
                        )}

                        {currentTab === "guidelines" && (
                            <div className="space-y-4">
                                {/* 社区宗旨 */}
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex items-start gap-3">
                                    <HeartHandshake className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="text-xs sm:text-sm">
                                        <p className="font-semibold text-foreground">Scholarly 社区精神</p>
                                        <p className="text-muted-foreground mt-0.5">
                                            我们倡导：<strong>自由探索、求真务实、理性质疑、学术诚信、包容互敬</strong>。本公约为全体学者的共同自律准则。
                                        </p>
                                    </div>
                                </div>

                                {/* 第一章：学术诚信规范 */}
                                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                                            <Scale className="w-4 h-4" />
                                        </div>
                                        <span>第一章：学术规范与原创诚信</span>
                                    </div>
                                    <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground leading-relaxed pl-1">
                                        <li>
                                            <strong>坚决抵制抄袭：</strong>发表文章、公式推导或实验分析时，必须保持原创；引用他人成果必须清晰标注 Citation 出处与 DOI 链接。
                                        </li>
                                        <li>
                                            <strong>严禁数据造假：</strong>禁止发布伪造的实验数据、捏造的引用文献或虚假的学术背景。
                                        </li>
                                        <li>
                                            <strong>AI 内容标明：</strong>若文章或代码大篇幅由 AI 辅助生成，鼓励在开头注明，保持透明严谨。
                                        </li>
                                    </ul>
                                </div>

                                {/* 第二章：言论与研讨准则 */}
                                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600">
                                            <MessageSquare className="w-4 h-4" />
                                        </div>
                                        <span>第二章：理性研讨与交流公约</span>
                                    </div>
                                    <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground leading-relaxed pl-1">
                                        <li>
                                            <strong>就事论事，理性质疑：</strong>鼓励对学术观点、实验设计和证明过程提出学术批评，但必须基于逻辑与事实，严禁对学者进行人身攻击、扣帽子或恶意揣测。
                                        </li>
                                        <li>
                                            <strong>决斗场竞技精神：</strong>在“学术决斗场”切磋中，严格遵守规则，尊重对手，胜不骄败不馁。
                                        </li>
                                        <li>
                                            <strong>拒绝灌水与恶意引战：</strong>严禁发布无意义重复刷屏、恶意踩赞、操纵排行榜或发起群体对立。
                                        </li>
                                    </ul>
                                </div>

                                {/* 第三章：同行审议与安全防线 */}
                                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600">
                                            <ShieldAlert className="w-4 h-4" />
                                        </div>
                                        <span>第三章：审校监督与分级惩戒</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        平台实行多模态 AI 审校与人工同行评议双轨机制。一旦发现违规行为，将依据严重程度实行：<strong>口头警告 $\rightarrow$ 扣除学术声望/积分 $\rightarrow$ 限制交互 $\rightarrow$ 封禁处理</strong>。
                                    </p>
                                </div>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* 签署确认与下一步控制 */}
            <div className="pt-2 flex flex-col items-center space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none group px-4 py-2.5 rounded-2xl bg-card/60 hover:bg-card/90 border border-border/60 transition-all shadow-sm">
                    <Checkbox
                        id="terms-check"
                        checked={agreed}
                        onCheckedChange={(checked) => setAgreed(!!checked)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5 rounded-md"
                    />
                    <span className="text-xs sm:text-sm text-foreground/90 group-hover:text-foreground">
                        我已完整阅读、充分理解并自愿承诺严格遵守
                        <span className="font-semibold text-primary">《Scholarly 用户服务协议》</span>与
                        <span className="font-semibold text-primary">《社区行为公约》</span>
                    </span>
                </label>

                <Button
                    size="lg"
                    disabled={!agreed || submitting}
                    onClick={handleConfirm}
                    className="w-full sm:w-80 h-12 text-sm font-semibold rounded-xl bg-gradient-to-r from-primary via-violet-600 to-primary bg-[length:200%_auto] hover:bg-right transition-all duration-300 shadow-lg shadow-primary/25 group cursor-pointer"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            签署公约中...
                        </>
                    ) : (
                        <>
                            签署公约并进入学者建档
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
