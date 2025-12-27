import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
    return (
        <footer className="bg-slate-950 border-t border-white/10">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Logo & 描述 */}
                    <div className="md:col-span-2">
                        <Link href="/" className="inline-block">
                            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                Scholarly
                            </span>
                        </Link>
                        <p className="mt-4 text-white/50 leading-relaxed max-w-sm">
                            一个专注于学术讨论的现代化社区，让知识分享更加便捷，让思想交流更加深入。
                        </p>
                    </div>

                    {/* 快速链接 */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">快速链接</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/login" className="text-white/50 hover:text-white transition-colors">
                                    登录
                                </Link>
                            </li>
                            <li>
                                <Link href="/register" className="text-white/50 hover:text-white transition-colors">
                                    注册
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-white/50 hover:text-white transition-colors">
                                    关于我们
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 联系方式 */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">联系方式</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="mailto:contact@scholarly.com" className="text-white/50 hover:text-white transition-colors">
                                    contact@scholarly.com
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white/50 hover:text-white transition-colors">
                                    GitHub
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <Separator className="my-8 bg-white/10" />

                {/* 版权信息 */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-white/40 text-sm">
                        © {new Date().getFullYear()} Scholarly. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-sm">
                        <Link href="#" className="text-white/40 hover:text-white/70 transition-colors">
                            隐私政策
                        </Link>
                        <Link href="#" className="text-white/40 hover:text-white/70 transition-colors">
                            服务条款
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
