import Link from "next/link";
import { BookOpen, Lightbulb, MessageSquare, Sigma } from "lucide-react";

const features = [
    {
        icon: MessageSquare,
        text: "专注学术讨论",
    },
    {
        icon: Sigma,
        text: "支持 LaTeX 公式",
    },
    {
        icon: BookOpen,
        text: "知识沉淀与分享",
    },
    {
        icon: Lightbulb,
        text: "跨学科交流",
    },
];

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex">
            {/* 左侧 - 学术氛围背景 */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
                {/* 装饰性光效 */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" />
                </div>

                {/* 网格背景 */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* 内容 */}
                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
                    {/* Logo */}
                    <Link href="/" className="inline-block mb-8">
                        <span className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                            Scholarly
                        </span>
                    </Link>

                    {/* 标语 */}
                    <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                        让学术交流
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            更加精彩
                        </span>
                    </h2>

                    <p className="text-lg text-white/60 max-w-md mb-10">
                        加入 Scholarly，与全球学者共同探讨前沿话题，分享知识与见解。
                    </p>

                    {/* 功能亮点 */}
                    <div className="space-y-4">
                        {features.map((feature) => (
                            <div
                                key={feature.text}
                                className="flex items-center gap-3"
                            >
                                <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                                    <feature.icon className="w-5 h-5 text-cyan-400" />
                                </div>
                                <span className="text-white/80">{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 装饰性元素 */}
                <div className="absolute bottom-10 left-10 right-10">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                            S
                        </div>
                        <div>
                            <p className="text-white font-medium">欢迎加入学术社区</p>
                            <p className="text-white/50 text-sm">已有 1000+ 学者在此交流</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 右侧 - 表单区域 */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background">
                <div className="w-full max-w-md">
                    {/* 移动端 Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link href="/" className="inline-block">
                            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                                Scholarly
                            </span>
                        </Link>
                    </div>

                    {/* 表单内容 */}
                    <div className="p-8 rounded-2xl bg-card border border-border shadow-sm">
                        {children}
                    </div>

                    {/* 返回首页 */}
                    <p className="text-center mt-6 text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-foreground transition-colors">
                            ← 返回首页
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
