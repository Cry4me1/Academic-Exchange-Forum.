"use client";

import { getMyCredits } from "@/app/(protected)/credits/actions";
import {
    AiFeatureCard,
    AnnouncementCard,
    CreditRechargeDialog,
    FeedTabs,
    FriendsList,
    GlobalSearch,
    MainNav,
    MobileTabBar,
    PostFeed,
    QuickPostButton,
    StoryBanner,
    TagCloud,
    WelcomeModal,
    type FeedFilter
} from "@/components/dashboard";
import { NotificationCenter } from "@/components/notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
    Coins,
    LogOut,
    Settings,
    User
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// 动画变体
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as const,
        },
    },
};

const slideInLeft = {
    hidden: { opacity: 0, x: -30 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] as const,
        },
    },
};

const slideInRight = {
    hidden: { opacity: 0, x: 30 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] as const,
        },
    },
};

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as const,
        },
    },
};

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState<FeedFilter>("latest");
    const [isRechargeOpen, setIsRechargeOpen] = useState(false);
    const [creditBalance, setCreditBalance] = useState<number | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<{
        username: string | null;
        email: string | null;
        avatar_url: string | null;
    } | null>(null);
    const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);

    const supabase = createClient();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login"); // Redirect to login
        router.refresh(); // Clear server cache
    };

    // 获取当前用户
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
                setUserCreatedAt(user.created_at);

                // 尝试获取用户 profile
                const { data: profile, error } = await supabase
                    .from("profiles")
                    .select("username, email, avatar_url")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    setCurrentUser(profile);
                } else if (error && error.code === 'PGRST116') {
                    // Profile 不存在 (PGRST116)，尝试创建
                    const newProfile = {
                        id: user.id,
                        email: user.email || null,
                        username: user.email?.split('@')[0] || "User",
                        avatar_url: ""
                    };

                    const { error: insertError } = await supabase
                        .from("profiles")
                        .insert([newProfile]);

                    if (!insertError) {
                        setCurrentUser(newProfile);
                        console.log("Auto-created missing profile");
                    } else {
                        console.error("Failed to auto-create profile:", insertError);
                    }
                }

                // 获取积分余额
                const credits = await getMyCredits();
                setCreditBalance(credits.balance);
            }
        };
        getUser();
    }, [supabase]);

    // 充值弹窗关闭时刷新余额
    const handleRechargeOpenChange = async (open: boolean) => {
        setIsRechargeOpen(open);
        if (!open) {
            const credits = await getMyCredits();
            setCreditBalance(credits.balance);
        }
    };

    // 全局事件: AI 积分不足时打开充值弹窗
    useEffect(() => {
        const handler = () => setIsRechargeOpen(true);
        window.addEventListener("open-recharge-dialog", handler);
        return () => window.removeEventListener("open-recharge-dialog", handler);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {/* 顶部导航栏 */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
            >
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <Image src="/logo.png" alt="Scholarly Logo" width={32} height={32} className="rounded-lg object-cover" />
                                <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                    Scholarly
                                </span>
                            </Link>
                        </div>

                        {/* 桌面端搜索栏 */}
                        <div className="hidden md:flex flex-1 max-w-md mx-8">
                            <GlobalSearch className="w-full" />
                        </div>

                        {/* 右侧操作区 */}
                        <div className="flex items-center gap-2">
                            {/* 通知中心 */}
                            {currentUserId && (
                                <NotificationCenter currentUserId={currentUserId} />
                            )}

                            {/* 用户菜单 */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={currentUser?.avatar_url || ""} alt="用户头像" />
                                            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-semibold">
                                                {(currentUser?.username || currentUser?.email || "我").charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium">{currentUser?.username || "当前用户"}</p>
                                            <p className="text-xs text-muted-foreground">{currentUser?.email || "user@example.com"}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={currentUserId ? `/user/${currentUserId}` : "/dashboard"} className="cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            个人主页
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/settings/profile" className="cursor-pointer">
                                            <Settings className="mr-2 h-4 w-4" />
                                            设置
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive cursor-pointer"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        退出登录
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* 移动端无菜单按钮，改用底部 Tab Bar */}
                            {/* 积分余额胶囊按钮 */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-full border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/60 transition-all duration-300 shadow-sm hover:shadow-amber-500/10"
                                onClick={() => setIsRechargeOpen(true)}
                            >
                                <Coins className="h-4 w-4" />
                                <span className="font-semibold tabular-nums">{creditBalance !== null ? creditBalance.toLocaleString() : '...'}</span>
                                <span className="text-xs opacity-60">积分</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* New Year Popup */}
                <CreditRechargeDialog isOpen={isRechargeOpen} onOpenChange={handleRechargeOpenChange} />
            </motion.header>

            {/* 主内容区域 */}
            <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">
                    {/* 左侧栏 - 桌面端显示，固定定位 */}
                    <aside className="hidden lg:block w-80 shrink-0">
                        <motion.div
                            variants={slideInLeft}
                            initial="hidden"
                            animate="visible"
                            className="fixed top-20 w-80 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 scrollbar-hidden"
                        >
                            {/* 主导航 */}
                            <motion.div
                                variants={itemVariants}
                                className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4"
                            >
                                <MainNav />
                            </motion.div>

                            {/* 好友列表 */}
                            <motion.div
                                variants={itemVariants}
                                className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4"
                            >
                                <h3 className="text-sm font-semibold text-foreground mb-3 px-2">好友动态</h3>
                                <FriendsList currentUserId={currentUserId} />
                            </motion.div>
                        </motion.div>
                    </aside>

                    {/* 中间栏 - 主要内容 */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex-1 min-w-0"
                    >
                        {/* 移动端搜索栏 */}
                        <div className="md:hidden mb-4">
                            <GlobalSearch />
                        </div>

                        {/* Mobile/Tablet only: Right sidebar content */}
                        <div className="xl:hidden space-y-6 mb-6">
                            <AnnouncementCard />
                            <AiFeatureCard />
                            <TagCloud />
                        </div>

                        {/* 动态横幅 StoryBanner */}
                        <motion.div variants={fadeInUp} className="mb-6">
                            <StoryBanner />
                        </motion.div>

                        {/* Tabs 筛选器 */}
                        <motion.div variants={fadeInUp} className="mb-6 sticky top-20 z-30 bg-background/80 backdrop-blur-md pb-2">
                            <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
                        </motion.div>

                        {/* 帖子列表 */}
                        <motion.div variants={fadeInUp}>
                            <PostFeed filter={activeTab} />
                        </motion.div>
                    </motion.div>

                    {/* 右侧栏 - 桌面端显示 */}
                    <aside className="hidden xl:block w-[340px] shrink-0">
                        <motion.div
                            variants={slideInRight}
                            initial="hidden"
                            animate="visible"
                            className="sticky top-24 space-y-6 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 scrollbar-hidden"
                        >
                            {/* 快速发帖 */}
                            <motion.div variants={itemVariants}>
                                <QuickPostButton />
                            </motion.div>

                            {/* 公告卡片 */}
                            <motion.div variants={itemVariants}>
                                <AnnouncementCard />
                            </motion.div>

                            {/* AI Feature Announcement with Animation */}
                            <motion.div variants={itemVariants}>
                                <AiFeatureCard />
                            </motion.div>

                            {/* 热门话题 */}
                            <motion.div variants={itemVariants}>
                                <TagCloud />
                            </motion.div>
                        </motion.div>
                    </aside>
                </div>
            </main>

            {/* 移动端底部 Tab Bar (替代汉堡菜单) */}
            <MobileTabBar currentUserId={currentUserId} />

            {/* 欢迎弹窗 / 正式版通知 */}
            <WelcomeModal userCreatedAt={userCreatedAt} />
        </div>
    );
}
