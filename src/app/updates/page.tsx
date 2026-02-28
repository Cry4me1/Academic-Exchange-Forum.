import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Activity,
    ArrowLeft,
    BookOpen,
    Cloud,
    Crown,
    FileText,
    GitMerge,
    Heart,
    Layers,
    LayoutDashboard,
    MessageSquare,
    Palette,
    PenTool,
    Rocket,
    ShieldCheck,
    Sparkles,
    Star,
    Users,
    Zap,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "更新日志 - Scholarly",
    description: "Scholarly 学术论坛的最新更新与改进记录",
};

export default function UpdatesPage() {
    return (
        <div className="relative min-h-screen">
            {/* ═══════════════════════════════════════════════════════  */}
            {/* Animated Background Layer – CSS-only floating particles */}
            {/* ═══════════════════════════════════════════════════════  */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
                {/* Large blurred gradient orbs that slowly drift */}
                <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] animate-[drift_18s_ease-in-out_infinite_alternate]" />
                <div className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[100px] animate-[drift_22s_ease-in-out_infinite_alternate-reverse]" />
                <div className="absolute -bottom-32 left-1/3 h-[350px] w-[350px] rounded-full bg-amber-500/8 blur-[100px] animate-[drift_20s_ease-in-out_infinite_alternate]" />
            </div>

            <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6">
                {/* Back button */}
                <div className="mb-8">
                    <Button variant="ghost" asChild className="pl-0 hover:bg-transparent hover:text-primary">
                        <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground">
                            <ArrowLeft className="w-4 h-4" />
                            返回控制台
                        </Link>
                    </Button>
                </div>

                {/* ═══════════════════════════════════════════  */}
                {/* Hero Header with animated gradient text      */}
                {/* ═══════════════════════════════════════════  */}
                <div className="relative mb-16 text-center space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm animate-[fadeInDown_0.6s_ease-out]">
                        <Rocket className="w-4 h-4" />
                        正式版发布
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl animate-[fadeInDown_0.8s_ease-out]">
                        <span className="bg-gradient-to-r from-primary via-violet-500 to-amber-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                            更新日志
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto animate-[fadeInUp_0.8s_ease-out]">
                        Scholarly 的演进历程与最新功能发布 —— 从内测走向正式，感谢每一位先行者的陪伴
                    </p>
                </div>

                {/* Timeline */}
                <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 md:ml-6 space-y-12">

                    {/* ╔══════════════════════════════════════════════════╗ */}
                    {/* ║  v1.0.0 – 正式版发布 🎉                         ║ */}
                    {/* ╚══════════════════════════════════════════════════╝ */}
                    <div className="relative pl-8 md:pl-12 animate-[fadeInUp_0.7s_ease-out]">
                        {/* Pulsing timeline dot for the latest version */}
                        <div className="absolute -left-[7px] top-2 flex items-center justify-center">
                            <span className="absolute h-4 w-4 rounded-full bg-primary/40 animate-ping" />
                            <span className="relative h-3.5 w-3.5 rounded-full bg-gradient-to-br from-primary to-violet-500 ring-4 ring-background shadow-lg shadow-primary/30" />
                        </div>

                        <div className="flex flex-col gap-3 mb-5">
                            <time className="text-sm text-muted-foreground font-mono">2026-02-28</time>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex flex-wrap items-center gap-3">
                                <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                                    v1.0.0
                                </span>
                                <span className="text-foreground">— 正式版发布</span>
                                <Badge variant="default" className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white shadow-lg shadow-primary/25 animate-[pulse_2s_ease-in-out_infinite] text-xs px-3 py-1">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    正式版
                                </Badge>
                            </h2>
                            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                                历经数月的精心打磨，Scholarly 正式踏入 1.0 时代。这是一个里程碑式的版本——从内测到正式上线，承载着我们对学术交流体验的极致追求。
                            </p>
                        </div>

                        {/* Main Card with gradient border effect */}
                        <div className="relative group">
                            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/50 via-violet-500/50 to-amber-500/50 opacity-60 blur-sm group-hover:opacity-100 transition-opacity duration-500" />
                            <Card className="relative border-0 bg-card/80 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
                                {/* Subtle gradient overlay at top */}
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-amber-500" />

                                <CardHeader className="pt-8">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Rocket className="w-5 h-5 text-primary" />
                                        四大核心升级
                                    </CardTitle>
                                    <CardDescription>
                                        全方位提升学术交流体验，每一个功能都为你精心设计
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-8 pb-8">

                                    {/* Feature 1: Dashboard 帖子卡片升级 */}
                                    <div className="space-y-3 group/feature">
                                        <h3 className="font-bold text-lg flex items-center gap-2.5 text-foreground">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 group-hover/feature:bg-blue-500 group-hover/feature:text-white transition-colors duration-300">
                                                <LayoutDashboard className="w-4 h-4" />
                                            </span>
                                            Dashboard 帖子卡片全面升级
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>焕然一新的内容展示方式，让每一篇帖子都光彩夺目。</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li>全新卡片视觉设计：圆角玻璃态风格，支持渐变色彩与微光动画</li>
                                                <li>丰富的元信息展示：作者头像、VIP 徽章、阅读量、评论数一览无余</li>
                                                <li>智能内容预览：自动截取高质量摘要，支持 LaTeX 公式片段展示</li>
                                                <li>交互动效升级：悬停缩放、点赞粒子特效、平滑过渡动画</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <Separator className="opacity-50" />

                                    {/* Feature 2: 帖子详情页阅读体验提升 */}
                                    <div className="space-y-3 group/feature">
                                        <h3 className="font-bold text-lg flex items-center gap-2.5 text-foreground">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 group-hover/feature:bg-emerald-500 group-hover/feature:text-white transition-colors duration-300">
                                                <BookOpen className="w-4 h-4" />
                                            </span>
                                            帖子详情页 · 沉浸式阅读体验
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>学术阅读应该是一种享受，而非负担。</p>
                                            <div className="grid sm:grid-cols-2 gap-3 mt-3">
                                                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 space-y-1.5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors duration-300">
                                                    <span className="font-medium text-foreground text-xs uppercase tracking-wider">沉浸模式</span>
                                                    <p className="text-xs leading-relaxed">一键进入无干扰阅读环境，自动隐藏侧边栏与导航，专注内容本身</p>
                                                </div>
                                                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 space-y-1.5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors duration-300">
                                                    <span className="font-medium text-foreground text-xs uppercase tracking-wider">智能目录</span>
                                                    <p className="text-xs leading-relaxed">浮动 TOC 侧边栏，自动高亮当前章节，支持平滑滚动跳转</p>
                                                </div>
                                                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 space-y-1.5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors duration-300">
                                                    <span className="font-medium text-foreground text-xs uppercase tracking-wider">排版优化</span>
                                                    <p className="text-xs leading-relaxed">优雅的排版间距、段落样式、引用块风格，阅读舒适度大幅提升</p>
                                                </div>
                                                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 space-y-1.5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors duration-300">
                                                    <span className="font-medium text-foreground text-xs uppercase tracking-wider">评论增强</span>
                                                    <p className="text-xs leading-relaxed">评论排序、折叠回复、楼中楼、实时更新，讨论更高效</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="opacity-50" />

                                    {/* Feature 3: VIP 系统 */}
                                    <div className="space-y-3 group/feature">
                                        <h3 className="font-bold text-lg flex items-center gap-2.5 text-foreground">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 group-hover/feature:bg-gradient-to-br group-hover/feature:from-amber-500 group-hover/feature:to-yellow-400 group-hover/feature:text-white transition-all duration-300">
                                                <Crown className="w-4 h-4" />
                                            </span>
                                            VIP 会员系统正式上线
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>尊贵身份，专属权益，让学术之旅更加精彩。</p>
                                            <div className="mt-3 relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-violet-500/5 p-4">
                                                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl" />
                                                <ul className="space-y-2.5 relative">
                                                    <li className="flex items-start gap-2.5">
                                                        <Star className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                        <span><strong className="text-foreground">多等级体系：</strong>从 VIP 1 到 VIP 6，层层解锁专属特权与标识</span>
                                                    </li>
                                                    <li className="flex items-start gap-2.5">
                                                        <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                        <span><strong className="text-foreground">专属徽章：</strong>精美的 VIP 等级徽章，在社区中闪耀你的身份</span>
                                                    </li>
                                                    <li className="flex items-start gap-2.5">
                                                        <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                        <span><strong className="text-foreground">特权功能：</strong>优先审核、专属主题色、更大附件上传额度等</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="opacity-50" />

                                    {/* Feature 4: 个人主页颜色自定义 */}
                                    <div className="space-y-3 group/feature">
                                        <h3 className="font-bold text-lg flex items-center gap-2.5 text-foreground">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500 group-hover/feature:bg-gradient-to-br group-hover/feature:from-pink-500 group-hover/feature:to-rose-400 group-hover/feature:text-white transition-all duration-300">
                                                <Palette className="w-4 h-4" />
                                            </span>
                                            个人主页 · 颜色自定义
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>你的主页，你做主。支持全站配色方案自定义。</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {/* Color palette preview dots */}
                                                {[
                                                    "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
                                                    "bg-pink-500", "bg-rose-500", "bg-cyan-500", "bg-orange-500",
                                                ].map((color, i) => (
                                                    <div
                                                        key={color}
                                                        className={`h-6 w-6 rounded-full ${color} shadow-lg ring-2 ring-background hover:scale-125 transition-transform duration-200`}
                                                        style={{ animationDelay: `${i * 100}ms` }}
                                                    />
                                                ))}
                                            </div>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5 mt-3">
                                                <li>提供多种精选配色方案</li>
                                                <li>支持多种渐变色主题，他人可见你的主页风格</li>
                                                <li>个人偏好自动同步，多端体验一致，让你的主页更加个性化</li>
                                            </ul>
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════  */}
                    {/*  🎯 内测 → 正式版 分界线                                */}
                    {/* ═══════════════════════════════════════════════════════  */}
                    <div className="relative pl-8 md:pl-12">
                        <div className="absolute -left-[7px] top-1/2 -translate-y-1/2 flex items-center justify-center">
                            <span className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-500 dark:from-zinc-500 dark:to-zinc-600 ring-4 ring-background" />
                        </div>

                        <div className="relative my-4">
                            {/* Decorative horizontal line */}
                            <div className="absolute inset-0 flex items-center" aria-hidden>
                                <div className="w-full border-t-2 border-dashed border-zinc-300 dark:border-zinc-700" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-background px-4 py-2 text-sm font-semibold text-muted-foreground flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                    <Activity className="w-4 h-4" />
                                    以下为内测阶段版本 (Alpha / Beta)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ╔══════════════════════════════════════════════════╗ */}
                    {/* ║  v0.8.0 – 基础设施升级与私信增强                ║ */}
                    {/* ╚══════════════════════════════════════════════════╝ */}
                    <div className="relative pl-8 md:pl-12 opacity-75 hover:opacity-100 transition-opacity duration-300">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-muted-foreground/40 ring-4 ring-background" />

                        <div className="flex flex-col gap-2 mb-4">
                            <time className="text-sm text-muted-foreground font-mono">2026-01-25</time>
                            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                v0.8.0 - 基础设施升级与私信增强
                                <Badge variant="secondary" className="text-xs">内测版</Badge>
                            </h2>
                        </div>

                        <Card className="border-border/40 bg-card/30">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    核心升级概览
                                </CardTitle>
                                <CardDescription>
                                    本次更新主要集中在后端基础设施的迁移优化，以及用户私信体验的全面升级。
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">

                                {/* Feature Block 1: R2 Migration */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                                        <Cloud className="w-4 h-4 text-blue-500" />
                                        存储架构迁移 (Supabase → Cloudflare R2)
                                    </h3>
                                    <div className="pl-6 text-sm text-muted-foreground space-y-2">
                                        <p>
                                            为了提供更快的全球访问速度和更高的可靠性，我们将文件存储系统从 Supabase Storage 完整迁移至 <strong>Cloudflare R2</strong>。
                                        </p>
                                        <ul className="list-disc list-outside ml-4 space-y-1">
                                            <li>大幅降低文件加载延迟，优化图片与附件的传输性能。</li>
                                            <li>更灵活的存储策略，为未来的大规模学术资源托管打下基础。</li>
                                        </ul>
                                    </div>
                                </div>

                                <Separator />

                                {/* Feature Block 2: Private Messaging */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                                        <MessageSquare className="w-4 h-4 text-purple-500" />
                                        私信系统 2.0
                                    </h3>
                                    <div className="pl-6 text-sm text-muted-foreground space-y-2">
                                        <p>
                                            学术交流不仅仅是文字。我们重构了私信编辑器，并在底层对接了新的 R2 存储服务，带来了以下新特性：
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-4 mt-3">
                                            <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-3">
                                                <FileText className="w-5 h-5 text-indigo-500 mt-0.5" />
                                                <div>
                                                    <span className="font-medium text-foreground block mb-1">文件传输</span>
                                                    支持发送图片、文档等各类学术资料。内置文件预览功能，体验流畅。
                                                </div>
                                            </div>
                                            <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-3">
                                                <ShieldCheck className="w-5 h-5 text-green-500 mt-0.5" />
                                                <div>
                                                    <span className="font-medium text-foreground block mb-1">隐私与安全</span>
                                                    <ul className="list-disc ml-4 text-xs">
                                                        <li>附件 7 天自动过期清理，减少冗余并保护隐私。</li>
                                                        <li>支持 2 分钟内消息撤回，避免误发尴尬。</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </div>

                    {/* v0.7.0 */}
                    <div className="relative pl-8 md:pl-12 opacity-65 hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-muted-foreground/30 ring-4 ring-background" />

                        <div className="flex flex-col gap-2 mb-4">
                            <time className="text-sm text-muted-foreground font-mono">2026-01-10</time>
                            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                v0.7.0 - 深度学术阅读体验
                                <Badge variant="secondary" className="text-xs">内测版</Badge>
                            </h2>
                        </div>

                        <Card className="border-border/40 bg-card/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-emerald-500" />
                                    沉浸式阅读与公式引擎
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-primary" />
                                            KaTeX 公式引擎
                                        </h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            全面引入 KaTeX 渲染引擎，支持复杂的数学与化学方程式实时预览，渲染速度提升 300%。
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm flex items-center gap-2">
                                            <Layers className="w-4 h-4 text-primary" />
                                            智能沉浸模式
                                        </h4>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* v0.6.0 */}
                    <div className="relative pl-8 md:pl-12 opacity-55 hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-muted-foreground/25 ring-4 ring-background" />

                        <div className="flex flex-col gap-2 mb-4">
                            <time className="text-sm text-muted-foreground font-mono">2026-01-05</time>
                            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                v0.6.0 - 深度协作
                                <Badge variant="secondary" className="text-xs">内测版</Badge>
                            </h2>
                        </div>

                        <Card className="border-border/40 bg-card/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <GitMerge className="w-5 h-5 text-blue-500" />
                                    团队协作系统
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex gap-2">
                                        <span className="bg-primary/10 text-primary rounded-full p-1 h-fit mt-0.5">
                                            <Users className="w-3 h-3" />
                                        </span>
                                        <span>
                                            <strong className="text-foreground">问题提出系统：</strong>
                                            支持帖主采纳回答
                                        </span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* v0.5.0 */}
                    <div className="relative pl-8 md:pl-12 opacity-50 hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-muted-foreground/20 ring-4 ring-background" />

                        <div className="flex flex-col gap-2 mb-4">
                            <time className="text-sm text-muted-foreground font-mono">2026-01-03</time>
                            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                v0.5.0 - 社区基石
                                <Badge variant="secondary" className="text-xs">内测版</Badge>
                            </h2>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 bg-muted p-2 rounded-md">
                                    <Users className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">学者身份体系上线</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        集成了 ORCID 认证登陆，建立了基于贡献质量的动态声望算法。
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 bg-muted p-2 rounded-md">
                                    <PenTool className="w-5 h-5 text-pink-500" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">Markdown 增强版编辑器</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        完整支持 Mermaid 流程图、甘特图以及学术表格扩展。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════  */}
                {/*  🎉 欢迎语模块                                          */}
                {/* ═══════════════════════════════════════════════════════  */}
                <div className="mt-20 relative overflow-hidden rounded-2xl border border-primary/20">
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-violet-500/5 to-amber-500/10" />
                    <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />

                    <div className="relative px-8 py-12 text-center space-y-5">
                        <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-500 text-white shadow-xl shadow-primary/25 animate-[bounce_3s_ease-in-out_infinite]">
                                <Heart className="w-8 h-8" />
                            </div>
                        </div>

                        <div className="space-y-3 max-w-lg mx-auto">
                            <h3 className="text-2xl font-extrabold tracking-tight">
                                欢迎来到{" "}
                                <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                                    Scholarly
                                </span>
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                感谢每一位在内测阶段陪伴我们的先行者，你们的反馈让 Scholarly 走到了今天。
                                今天，我们正式向所有学术爱好者敞开大门——
                            </p>
                            <p className="text-lg font-semibold text-foreground">
                                无论你是学生、老师，还是对知识充满好奇的探索者，
                                <br />
                                <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                                    Scholarly 都是属于你的学术家园。
                                </span>
                            </p>
                            <p className="text-muted-foreground text-sm italic">
                                &ldquo;知识因分享而永恒，思想因碰撞而闪光。&rdquo;
                            </p>
                        </div>

                        <div className="pt-4">
                            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white shadow-lg shadow-primary/25 group">
                                <Link href="/dashboard" className="flex items-center gap-2">
                                    开始探索
                                    <Rocket className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Made by signature */}
                <div className="mt-12 pb-4 text-center">
                    <p className="text-sm text-muted-foreground/60 flex items-center justify-center gap-1.5">
                        Made with <Heart className="w-3.5 h-3.5 text-pink-500 animate-pulse" /> by{" "}
                        <span className="font-semibold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                            Hansszh
                        </span>
                    </p>
                </div>

            </div>

            {/* ═══════════════════════════════════════════  */}
            {/* Custom CSS Keyframes                        */}
            {/* ═══════════════════════════════════════════  */}
            <style>{`
                @keyframes drift {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(40px, 30px) scale(1.1); }
                }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shimmer {
                    0% { background-position: 200% center; }
                    100% { background-position: -200% center; }
                }
            `}</style>
        </div>
    );
}
