import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Activity, ArrowLeft, BookOpen, Cloud, FileText, GitMerge, Layers, MessageSquare, PenTool, ShieldCheck, Users, Zap } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "更新日志 - Scholarly",
    description: "Scholarly 学术论坛的最新更新与改进记录",
};

export default function UpdatesPage() {
    return (
        <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6">
            <div className="mb-8">
                <Button variant="ghost" asChild className="pl-0 hover:bg-transparent hover:text-primary">
                    <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground">
                        <ArrowLeft className="w-4 h-4" />
                        返回控制台
                    </Link>
                </Button>
            </div>

            <div className="space-y-4 mb-12 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">
                    更新日志
                </h1>
                <p className="text-muted-foreground text-lg">
                    Scholarly 的演进历程与最新功能发布
                </p>
            </div>

            <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-4 md:ml-6 space-y-12">
                {/* Latest Update */}
                <div className="relative pl-8 md:pl-12">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />

                    <div className="flex flex-col gap-2 mb-4">
                        <time className="text-sm text-muted-foreground font-mono">2026-01-25</time>
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            v0.8.0 - 基础设施升级与私信增强
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">Latest</Badge>
                        </h2>
                    </div>

                    <Card className="border-border/60 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
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

                {/* Previous Update (Placeholder/Example) */}
                {/* v0.7.0 - Deep Academic Reading */}
                <div className="relative pl-8 md:pl-12 opacity-90">
                    <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-muted-foreground/40 ring-4 ring-background" />

                    <div className="flex flex-col gap-2 mb-4">
                        <time className="text-sm text-muted-foreground font-mono">2026-01-10</time>
                        <h2 className="text-xl font-bold tracking-tight">v0.7.0 - 深度学术阅读体验</h2>
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

                {/* v0.6.0 - Collaboration */}
                <div className="relative pl-8 md:pl-12 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-muted-foreground/30 ring-4 ring-background" />

                    <div className="flex flex-col gap-2 mb-4">
                        <time className="text-sm text-muted-foreground font-mono">2026-01-05</time>
                        <h2 className="text-xl font-bold tracking-tight">v0.6.0 - 深度协作</h2>
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

                {/* v0.5.0 - Foundation */}
                <div className="relative pl-8 md:pl-12 opacity-70 hover:opacity-100 transition-opacity">
                    <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-muted-foreground/20 ring-4 ring-background" />

                    <div className="flex flex-col gap-2 mb-4">
                        <time className="text-sm text-muted-foreground font-mono">2026-01-03</time>
                        <h2 className="text-xl font-bold tracking-tight">v0.5.0 - 社区基石</h2>
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
        </div>
    );
}
