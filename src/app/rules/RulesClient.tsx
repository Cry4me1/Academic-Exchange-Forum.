"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertOctagon,
    AlertTriangle,
    ArrowLeft,
    Ban,
    BookOpen,
    CheckCircle2,
    Clock,
    Database,
    FileCheck,
    FileCode,
    FileLock2,
    FileSpreadsheet,
    FileText,
    Flame,
    Gavel,
    Globe,
    Handshake,
    HardDrive,
    HeartHandshake,
    ImageIcon,
    Lock,
    MessageSquare,
    Scale,
    ScrollText,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    UserCheck,
    UserX,
    Users,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function RulesClient() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const [currentTab, setCurrentTab] = useState<string>(
        tabParam === "guidelines" ? "guidelines" : "terms"
    );

    useEffect(() => {
        if (tabParam === "guidelines" || tabParam === "terms") {
            setCurrentTab(tabParam);
        }
    }, [tabParam]);

    return (
        <div className="relative min-h-screen bg-background">
            {/* 动态氛围背景 */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
                <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-amber-500/10 blur-[100px]" />
                <div className="absolute -bottom-32 left-1/3 h-[350px] w-[350px] rounded-full bg-blue-500/8 blur-[100px]" />
            </div>

            <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6">
                {/* 顶部返回与元信息 */}
                <div className="mb-8 flex items-center justify-between">
                    <Button variant="ghost" asChild className="pl-0 hover:bg-transparent hover:text-primary">
                        <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground">
                            <ArrowLeft className="w-4 h-4" />
                            返回主页
                        </Link>
                    </Button>
                    <Badge variant="outline" className="gap-1.5 py-1 px-3 border-primary/30 text-primary">
                        <Sparkles className="w-3.5 h-3.5" />
                        法律文件 & 行为公约 v2026.1
                    </Badge>
                </div>

                {/* 页面主标题 */}
                <div className="mb-8 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                        <Shield className="w-3.5 h-3.5" />
                        Scholarly 平台治理与合规中心
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                        法律协议与社区准则
                    </h1>
                    <p className="mt-3 text-base text-muted-foreground max-w-2xl leading-relaxed">
                        Scholarly 致力于打造专业、严谨、开放且合规的学术交流共同体。请学者们仔细查阅下方用户协议与社区公约。
                    </p>
                </div>

                {/* 双支柱 Tab 切换 */}
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full space-y-8">
                    <TabsList className="grid w-full grid-cols-2 p-1.5 bg-muted/60 border border-border/60 rounded-xl h-auto">
                        <TabsTrigger
                            value="terms"
                            className="py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md font-medium text-sm sm:text-base flex items-center justify-center gap-2 transition-all"
                        >
                            <ScrollText className="w-4 h-4 text-primary" />
                            <span>📜 用户协议（法律文件）</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="guidelines"
                            className="py-3 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md font-medium text-sm sm:text-base flex items-center justify-center gap-2 transition-all"
                        >
                            <HeartHandshake className="w-4 h-4 text-emerald-500" />
                            <span>📋 社区公约（行为准则）</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* ========================================================================= */}
                    {/* TAB 1: 📜 用户协议（法律文件） */}
                    {/* ========================================================================= */}
                    <TabsContent value="terms" className="space-y-6 focus-visible:outline-none">
                        {/* 协议性质卡片 */}
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3.5">
                            <FileCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-foreground">协议性质说明</p>
                                <p className="text-muted-foreground mt-0.5">
                                    本协议为您与 Scholarly 平台之间具有法律效力的服务合同。注册、登录或使用本平台即代表您已完整阅读并同意受本协议所有条款约束。
                                </p>
                            </div>
                        </div>

                        {/* 1. 免责声明 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <Scale className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第一条：免责声明</CardTitle>
                                        <CardDescription>平台定位与内容独立责任声明</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 font-semibold text-amber-800 dark:text-amber-300">
                                    “本站为个人学术兴趣交流平台，内容由用户自行发布，不代表本站立场”
                                </div>
                                <p className="text-muted-foreground">
                                    1.1 Scholarly 平台为广大研学者提供学术讨论、代码分享、文献解读与同行评审的技术载体与信息存储空间服务。
                                </p>
                                <p className="text-muted-foreground">
                                    1.2 用户在平台发表的所有文章、评论、公式、数据及观点，均属发布者个人行为，并不代表本平台立场。平台不对用户发布内容的准确性、完整性、学术有效性或适用性作任何明示或暗示的担保。学者在参考、引用相关内容时应保持学术审慎并自行承担相应风险。
                                </p>
                            </CardContent>
                        </Card>

                        {/* 2. 数据留存说明 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        <Database className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第二条：数据留存说明</CardTitle>
                                        <CardDescription>文字消息持久化与附件生命周期规则</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 font-semibold text-blue-800 dark:text-blue-300">
                                    “文字消息永久保存，文件7天后自动删除”
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                                        <h4 className="font-medium text-foreground flex items-center gap-1.5">
                                            <MessageSquare className="w-4 h-4 text-blue-500" />
                                            文字记录持久化
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            <strong>“文字消息记录将被永久保存，用于保障社区安全与处理纠纷”</strong>。公开研讨、文章评论及点对点私信文字记录将加密永久存档，用于学术脉络查阅及合规纠纷取证。
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                                        <h4 className="font-medium text-foreground flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-indigo-500" />
                                            文件自动销毁
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            <strong>“上传的文件将在7天后自动删除，请及时保存重要内容”</strong>。私信传输或临时上传的文件（文档、代码包、音视频等）自上传时起保留 7 天，到期后系统物理清除且无法恢复，请用户及时本地保存。
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. 用户义务 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <FileCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第三条：用户义务</CardTitle>
                                        <CardDescription>守法合规与图片/多媒体内容责任</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-semibold text-emerald-800 dark:text-emerald-300">
                                    “不得发布违法违规内容”
                                </div>
                                <ul className="list-disc list-inside space-y-2 text-muted-foreground text-xs sm:text-sm pl-1">
                                    <li>
                                        <strong>合法守规承诺：</strong>用户承诺在使用本平台服务时，严格遵守国家各项法律法规，不得利用平台制作、复制、发布、传播任何违法违规信息。
                                    </li>
                                    <li>
                                        <strong>图片与多媒体责任自负：</strong><strong>用户对所上传的所有图片、图表、附件等内容独立承担全部内容责任与版权责任</strong>。严禁盗用他人版权图表，引用学术插图必须注明 Citation 来源。
                                    </li>
                                    <li>
                                        <strong>网络安全维护：</strong>严禁利用漏洞攻击系统、注入恶意脚本（包括含 XSS 攻击的 SVG 图片）、爬取敏感信息或干扰服务器正常运行。
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* 4. 账号管理 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                        <UserCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第四条：账号管理</CardTitle>
                                        <CardDescription>账号安全责任与身份管理</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-violet-500/10 border border-violet-500/20 font-semibold text-violet-800 dark:text-violet-300">
                                    “用户对自己的账号行为负责”
                                </div>
                                <p className="text-muted-foreground">
                                    4.1 用户应当妥善保管个人账号密码与绑定凭证。凡使用该账号登录后进行的一切操作（包括发帖、评论、修改资料、积分消费、决斗下注等），均视为用户本人行为，由此产生的全部法律后果均由该用户自行承担。
                                </p>
                                <p className="text-muted-foreground">
                                    4.2 严禁将账号转让、出借、租售给他人使用。如发现账号存在未经授权的异常登录，应立即通过平台重置密码或联系管理员。
                                </p>
                            </CardContent>
                        </Card>

                        {/* 5. 终止权 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                                        <Gavel className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第五条：终止权与治理措施</CardTitle>
                                        <CardDescription>平台处置违规行为的法定权利</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 font-semibold text-red-800 dark:text-red-300">
                                    “本站有权删除违规内容或封禁账号”
                                </div>
                                <p className="text-muted-foreground">
                                    5.1 若用户违反法律法规、本用户协议或社区公约，<strong>本站有权在无需事先通知的情况下，独立判断并采取警告、隐藏内容、删除帖子/评论/图片、扣除积分、限制功能直至永久封禁账号等处置措施</strong>。
                                </p>
                                <p className="text-muted-foreground">
                                    5.2 对涉及严重违法或侵权的违规证据，平台将依法予以留存，并在司法机关依法调取时予以配合。
                                </p>
                            </CardContent>
                        </Card>

                        {/* 6. 隐私政策 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                        <FileLock2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第六条：隐私政策</CardTitle>
                                        <CardDescription>信息收集范围与隐私保护承诺</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 font-semibold text-cyan-800 dark:text-cyan-300">
                                    “本站收集哪些信息、如何保护”
                                </div>
                                <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                                    <p>
                                        <strong>1. 收集范围（最小必要原则）：</strong>
                                    </p>
                                    <ul className="list-disc list-inside pl-2 space-y-1">
                                        <li>账户基础信息：注册邮箱、学者用户名、头像及个人学术简介；</li>
                                        <li>学术认证信息：自主绑定的第三方学术平台标识（如洛谷 OJ ID 等）；</li>
                                        <li>操作与安全日志：登录时间、操作记录、防刷安全 IP 等（仅用于维护系统安全）。</li>
                                    </ul>
                                    <p className="mt-2">
                                        <strong>2. 如何保护：</strong>
                                    </p>
                                    <ul className="list-disc list-inside pl-2 space-y-1">
                                        <li>全站采用传输层 HTTPS 加密与数据库行级安全策略（RLS），防止未授权访问；</li>
                                        <li>绝不向任何第三方商业实体出售、出租或非法共享学者隐私数据；</li>
                                        <li>敏感密钥与系统配置均在隔离环境安全运行。</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ========================================================================= */}
                    {/* TAB 2: 📋 社区公约（行为准则） */}
                    {/* ========================================================================= */}
                    <TabsContent value="guidelines" className="space-y-6 focus-visible:outline-none">
                        {/* 社区愿景卡片 */}
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3.5">
                            <Handshake className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-emerald-800 dark:text-emerald-300">社区公约宣言</p>
                                <p className="text-muted-foreground mt-0.5">
                                    社区公约是我们共同守护的学术精神与文明家园准则。无论您的学术资历深浅，在这里我们以理服人、平等探讨、共同探索知识边界。
                                </p>
                            </div>
                        </div>

                        {/* 1. 价值观 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
                                        <HeartHandshake className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">一、核心价值观</CardTitle>
                                        <CardDescription>Scholarly 倡导的学术文化与研讨风尚</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-pink-500/10 border border-pink-500/20 font-semibold text-pink-800 dark:text-pink-300">
                                    “理性讨论、尊重他人、拒绝人身攻击”
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-center">
                                        <span className="font-semibold text-foreground block mb-1">🔍 理性求真</span>
                                        <span className="text-xs text-muted-foreground">以事实为依据，以逻辑与数据论证学术观点</span>
                                    </div>
                                    <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-center">
                                        <span className="font-semibold text-foreground block mb-1">🤝 尊重包容</span>
                                        <span className="text-xs text-muted-foreground">尊重学术异见与跨学科视角，虚心听取批评</span>
                                    </div>
                                    <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-center">
                                        <span className="font-semibold text-foreground block mb-1">🛡️ 杜绝霸凌</span>
                                        <span className="text-xs text-muted-foreground">严厉抵制针对个人的贬损、辱骂与学术霸凌</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. 允许什么 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">二、鼓励与倡导（允许什么）</CardTitle>
                                        <CardDescription>我们全力支持的优质学术行为</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-semibold text-emerald-800 dark:text-emerald-300">
                                    “鼓励发布原创观点、学术问题、经验分享”
                                </div>
                                <ul className="grid gap-2.5 text-xs sm:text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/40">
                                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <span><strong>原创学术见解：</strong>前沿论文研读笔记、算法设计构想、实验设计与数据复现心得。</span>
                                    </li>
                                    <li className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/40">
                                        <FileCode className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                        <span><strong>高质量学术问答：</strong>遇到学术瓶颈或代码 Bug 时，提供详实的最小复现代码与数学推导过程提问。</span>
                                    </li>
                                    <li className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/40">
                                        <BookOpen className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                                        <span><strong>科研避坑与经验：</strong>学术工具链使用教程、LaTeX 排版经验、论文投稿与同行评议经验交流。</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* 3. 禁止什么 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                                        <Ban className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">三、严格禁止行为（禁止什么）</CardTitle>
                                        <CardDescription>社区坚决零容忍的红线行为</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 font-semibold text-destructive">
                                    “严禁政治敏感、色情、暴力、广告、版权侵权内容”
                                </div>
                                <div className="grid gap-2.5 sm:grid-cols-2 text-xs sm:text-sm">
                                    <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1">
                                        <strong className="text-foreground block">🚫 违法与敏感信息</strong>
                                        <p className="text-muted-foreground text-xs">
                                            严禁发布涉政敏感、危害国家安全、破坏社会稳定、暴恐极端或淫秽色情内容。
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1">
                                        <strong className="text-foreground block">🚫 广告营销与灌水</strong>
                                        <p className="text-muted-foreground text-xs">
                                            严禁发布商业广告、灰色推广引流链接、利用机器人或自动化脚本批量灌水刷屏。
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1">
                                        <strong className="text-foreground block">🚫 版权侵权与抄袭</strong>
                                        <p className="text-muted-foreground text-xs">
                                            严禁抄袭剽窃他人成果、未经授权盗用他人图片或受保护的学术图表。
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1">
                                        <strong className="text-foreground block">🚫 作弊与恶意刷分</strong>
                                        <p className="text-muted-foreground text-xs">
                                            严禁利用平台技术漏洞或小号刷取信誉积分、恶意操纵决斗胜负等作弊行为。
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 4. 惩罚机制 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <AlertOctagon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">四、惩罚机制（阶梯处罚）</CardTitle>
                                        <CardDescription>透明、公正的治理执行标准</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 font-semibold text-amber-800 dark:text-amber-300">
                                    “第一次警告、第二次删帖、第三次封号”
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                                    <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-1.5">
                                        <Badge variant="outline" className="text-amber-600 border-amber-500/40">
                                            Step 1
                                        </Badge>
                                        <h4 className="font-semibold text-foreground">第一次违规：警告</h4>
                                        <p className="text-xs text-muted-foreground">
                                            发送站内信正式警告，提示具体违规条款，扣除违规所获积分并要求在限定时间内整改。
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-lg border border-orange-500/30 bg-orange-500/5 space-y-1.5">
                                        <Badge variant="outline" className="text-orange-600 border-orange-500/40">
                                            Step 2
                                        </Badge>
                                        <h4 className="font-semibold text-foreground">第二次违规：删帖/禁言</h4>
                                        <p className="text-xs text-muted-foreground">
                                            管理员直接下架并删除违规文章、评论或图片，并对账号实施 24~72 小时禁言或发帖功能限制。
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-lg border border-red-500/30 bg-red-500/5 space-y-1.5">
                                        <Badge variant="outline" className="text-red-600 border-red-500/40">
                                            Step 3
                                        </Badge>
                                        <h4 className="font-semibold text-destructive">第三次违规：封号</h4>
                                        <p className="text-xs text-muted-foreground">
                                            情节严重或屡教不改者，平台将永久封禁账号，终止一切服务，IP 计入限制名单。
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Separator className="my-10" />

                {/* 底部声明 */}
                <div className="text-center text-xs text-muted-foreground space-y-2">
                    <p>感谢您与我们共同守护 Scholarly 学术社区的纯净、开放与严谨。</p>
                    <p>© {new Date().getFullYear()} Scholarly. 让知识自由流动，让思想深刻碰撞。</p>
                </div>
            </div>
        </div>
    );
}
