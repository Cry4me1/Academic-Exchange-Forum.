"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import AskAiAnimation from "./AskAiAnimation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AiFeatureCard() {
    return (
        <Card className="bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 border-violet-200/50 dark:border-violet-500/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Sparkles className="w-24 h-24 text-violet-500 rotate-12" />
            </div>

            <CardHeader className="pb-3 z-10 relative">
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-800">
                        NEW FEATURE
                    </span>
                </div>
                <CardTitle className="text-lg bg-gradient-to-br from-violet-700 to-fuchsia-700 dark:from-violet-300 dark:to-fuchsia-300 bg-clip-text text-transparent">
                    Scholarly AI 助手
                </CardTitle>
                <CardDescription className="text-sm">
                    专业的学术写作伴侣，支持润色、翻译与语气调整。
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 z-10 relative">
                {/* Animation Container */}
                <div className="rounded-lg overflow-hidden border border-border/50 shadow-sm bg-background">
                    <AskAiAnimation />
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        选中文字或输入 <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">/</kbd> 唤起 AI，体验智能写作。
                    </p>
                    <Button asChild size="sm" className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 shadow-md shadow-violet-500/20">
                        <Link href="/posts/new">
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                            立即体验
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
