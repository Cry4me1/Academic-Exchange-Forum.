import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 transition-colors duration-500">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Logo & 描述 */}
                    <div className="md:col-span-2">
                        <Link href="/" className="inline-block">
                            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent transition-colors">
                                Scholarly
                            </span>
                        </Link>
                        <p className="mt-4 text-slate-600 dark:text-white/50 leading-relaxed max-w-sm transition-colors">
                            一个专注于学术讨论的现代化社区，让知识分享更加便捷，让思想交流更加深入。
                        </p>
                    </div>

                    {/* 快速链接 */}
                    <div>
                        <h4 className="text-slate-900 dark:text-white font-semibold mb-4 transition-colors">快速链接</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/login" className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    登录
                                </Link>
                            </li>
                            <li>
                                <Link href="/register" className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    注册
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    关于我们
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 联系方式 */}
                    <div>
                        <h4 className="text-slate-900 dark:text-white font-semibold mb-4 transition-colors">联系方式</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="mailto:ddanthumytrang@gmail.com" className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    ddanthumytrang@gmail.com
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    GitHub
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <Separator className="my-8 bg-slate-200 dark:bg-white/10 transition-colors" />

                {/* 版权信息 */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-2 text-slate-500 dark:text-white/40 text-sm transition-colors">
                        <span>© {new Date().getFullYear()} Scholarly. All rights reserved.</span>
                        <span className="hidden sm:inline">|</span>
                        <span>Made with ❤️ by 邵卓翰</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                        <Link href="#" className="text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/70 transition-colors">
                            隐私政策
                        </Link>
                        <Link href="#" className="text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/70 transition-colors">
                            服务条款
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
