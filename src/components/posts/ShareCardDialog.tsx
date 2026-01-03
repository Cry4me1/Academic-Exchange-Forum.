"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, Loader2, Moon, Sun, GraduationCap } from "lucide-react";
import { toast } from "sonner";

type ThemeType = "dark" | "light" | "academic";

interface ShareCardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    postId: string;
    postTitle: string;
}

const themeOptions: { value: ThemeType; label: string; icon: React.ReactNode; description: string }[] = [
    {
        value: "dark",
        label: "深色",
        icon: <Moon className="h-4 w-4" />,
        description: "科技感深色主题",
    },
    {
        value: "light",
        label: "浅色",
        icon: <Sun className="h-4 w-4" />,
        description: "简洁明亮主题",
    },
    {
        value: "academic",
        label: "学术蓝",
        icon: <GraduationCap className="h-4 w-4" />,
        description: "专业学术风格",
    },
];

export function ShareCardDialog({
    open,
    onOpenChange,
    postId,
    postTitle,
}: ShareCardDialogProps) {
    const [theme, setTheme] = useState<ThemeType>("dark");
    const [imageUrl, setImageUrl] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // 生成图片 URL
    useEffect(() => {
        if (open && postId) {
            setLoading(true);
            const url = `/api/og?postId=${postId}&theme=${theme}`;
            setImageUrl(url);

            // 预加载图片
            const img = new Image();
            img.onload = () => setLoading(false);
            img.onerror = () => {
                setLoading(false);
                toast.error("图片生成失败");
            };
            img.src = url;
        }
    }, [open, postId, theme]);

    // 下载图片
    const handleDownload = async () => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `${postTitle.slice(0, 30).replace(/[/\\?%*:|"<>]/g, "-")}-share.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("图片已下载");
        } catch (error) {
            console.error("Download error:", error);
            toast.error("下载失败");
        }
    };

    // 复制链接
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            toast.success("链接已复制到剪贴板");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("复制失败");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">生成分享卡片</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* 主题选择器 */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">选择主题风格</p>
                        <div className="grid grid-cols-3 gap-3">
                            {themeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setTheme(option.value)}
                                    className={`
                                        flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                                        ${theme === option.value
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                                        }
                                    `}
                                >
                                    <div className={`
                                        p-2 rounded-full transition-colors
                                        ${theme === option.value
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                        }
                                    `}>
                                        {option.icon}
                                    </div>
                                    <span className="font-medium text-sm">{option.label}</span>
                                    <span className="text-xs text-muted-foreground text-center">
                                        {option.description}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 预览区域 */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">卡片预览</p>
                        <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30">
                            {loading ? (
                                <div className="aspect-[1200/630] flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="text-sm text-muted-foreground">正在生成卡片...</span>
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={imageUrl}
                                    alt="分享卡片预览"
                                    className="w-full aspect-[1200/630] object-cover"
                                />
                            )}
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={handleCopyLink}
                        >
                            {copied ? (
                                <>
                                    <Check className="h-4 w-4" />
                                    已复制
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4" />
                                    复制链接
                                </>
                            )}
                        </Button>
                        <Button
                            className="flex-1 gap-2"
                            onClick={handleDownload}
                            disabled={loading}
                        >
                            <Download className="h-4 w-4" />
                            下载图片
                        </Button>
                    </div>

                    {/* 提示 */}
                    <p className="text-xs text-muted-foreground text-center">
                        下载图片后可分享到微信朋友圈、Twitter、微博等平台
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
