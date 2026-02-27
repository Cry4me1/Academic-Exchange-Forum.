"use client";

import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Check, Palette } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const bannerGradients = [
    {
        id: "default",
        name: "默认 (极光)",
        class: "bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100",
        preview: "bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100"
    },
    {
        id: "sunset",
        name: "日落 (暖阳)",
        class: "bg-gradient-to-r from-orange-100 via-amber-100 to-rose-100",
        preview: "bg-gradient-to-r from-orange-100 via-amber-100 to-rose-100"
    },
    {
        id: "ocean",
        name: "海洋 (深蓝)",
        class: "bg-gradient-to-r from-cyan-100 via-blue-100 to-sky-100",
        preview: "bg-gradient-to-r from-cyan-100 via-blue-100 to-sky-100"
    },
    {
        id: "forest",
        name: "森林 (清新)",
        class: "bg-gradient-to-r from-emerald-100 via-green-100 to-teal-100",
        preview: "bg-gradient-to-r from-emerald-100 via-green-100 to-teal-100"
    },
    {
        id: "lavender",
        name: "薰衣草 (梦幻)",
        class: "bg-gradient-to-r from-fuchsia-100 via-purple-100 to-pink-100",
        preview: "bg-gradient-to-r from-fuchsia-100 via-purple-100 to-pink-100"
    },
    {
        id: "midnight",
        name: "午夜 (深邃)",
        class: "bg-gradient-to-r from-slate-800 via-zinc-800 to-neutral-800",
        preview: "bg-gradient-to-r from-slate-800 via-zinc-800 to-neutral-800"
    }
];

interface BannerSelectorProps {
    currentStyle: string;
    onStyleChange: (style: string) => void;
}

export function BannerSelector({ currentStyle, onStyleChange }: BannerSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSelect = async (gradientId: string) => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("未登录");

            const { error } = await supabase
                .from("profiles")
                .update({ banner_style: gradientId })
                .eq("id", user.id);

            if (error) throw error;

            onStyleChange(gradientId);
            toast.success("背景已更新");
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to update banner:", error);
            toast.error("更新失败，请重试");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/30 hover:bg-white/50 backdrop-blur-md border border-white/20 shadow-sm transition-all"
                >
                    <Palette className="h-4 w-4 mr-2" />
                    更换背景
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
                <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">选择页面主题</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {bannerGradients.map((gradient) => (
                            <button
                                key={gradient.id}
                                disabled={loading}
                                onClick={() => handleSelect(gradient.id)}
                                className={cn(
                                    "relative h-16 rounded-md overflow-hidden border border-border/50 transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    gradient.preview,
                                    currentStyle === gradient.id && "ring-2 ring-primary ring-offset-2"
                                )}
                            >
                                {currentStyle === gradient.id && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                        <Check className="h-4 w-4 text-primary-foreground drop-shadow-md" />
                                    </div>
                                )}
                                <span className="absolute bottom-0 left-0 right-0 py-1 text-[10px] bg-white/80 backdrop-blur-[2px] text-center font-medium">
                                    {gradient.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
