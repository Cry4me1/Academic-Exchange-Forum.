import { Construction, FlaskConical, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "研究室 - Scholarly",
    description: "共创实验室 - 即将上线",
};

export default function LabPage() {
    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center space-y-6 max-w-md mx-auto px-4">
                {/* 图标动画 */}
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 rounded-full bg-violet-500/10 animate-ping" />
                    <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20">
                        <FlaskConical className="h-10 w-10 text-violet-500" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30">
                        <Construction className="h-4 w-4 text-amber-500" />
                    </div>
                </div>

                {/* 标题 */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">
                        共创实验室
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        该功能尚未上线
                    </p>
                </div>

                {/* 描述 */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                    共创实验室正在紧锣密鼓地开发中，我们将为你带来实时协作编辑、
                    共读研讨、知识共创等创新学术体验。敬请期待！
                </p>

                {/* 返回按钮 */}
                <Button asChild variant="outline" className="gap-2">
                    <Link href="/dashboard">
                        <ArrowLeft className="h-4 w-4" />
                        返回首页
                    </Link>
                </Button>
            </div>
        </div>
    );
}
