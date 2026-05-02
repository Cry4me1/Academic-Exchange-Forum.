"use client";

import { joinLabRoom } from "@/app/(protected)/lab/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    FlaskConical,
    Loader2,
    Lock,
    LogIn,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface JoinLabClientProps {
    room: {
        id: string;
        name: string;
        description?: string;
        room_type: string;
        max_members: number;
        memberCount: number;
    };
}

export default function JoinLabClient({ room }: JoinLabClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [accessCode, setAccessCode] = useState("");

    const isFull = room.memberCount >= room.max_members;

    const handleJoin = () => {
        startTransition(async () => {
            const result = await joinLabRoom(room.id, accessCode || undefined);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`已成功加入「${room.name}」`);
                router.push(`/lab/${room.id}`);
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-violet-500/5 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="mb-4">
                    <Link href="/lab">
                        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            返回研究室列表
                        </Button>
                    </Link>
                </div>

                <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 shadow-xl">
                    {/* 头部 */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-violet-500/10 mb-4">
                            <FlaskConical className="h-7 w-7 text-violet-500" />
                        </div>
                        <h1 className="text-xl font-bold text-foreground mb-1">
                            加入研究室
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            你被邀请加入以下研究室
                        </p>
                    </div>

                    {/* 房间信息 */}
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 mb-6 space-y-3">
                        <div>
                            <h2 className="font-semibold text-foreground text-lg">
                                {room.name}
                            </h2>
                            {room.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {room.description}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-xs">
                                {room.room_type === "reading" ? "帖子共读" : room.room_type === "whiteboard" ? "白板推导" : "混合模式"}
                            </Badge>
                            <span className={cn(
                                "text-xs flex items-center gap-1",
                                isFull ? "text-destructive" : "text-muted-foreground"
                            )}>
                                <Users className="h-3 w-3" />
                                {room.memberCount} / {room.max_members} 人
                            </span>
                        </div>
                    </div>

                    {/* 访问码（可选） */}
                    <div className="space-y-2 mb-6">
                        <Label htmlFor="access-code" className="flex items-center gap-1.5 text-sm">
                            <Lock className="h-3.5 w-3.5" />
                            访问码（如有）
                        </Label>
                        <Input
                            id="access-code"
                            type="password"
                            placeholder="输入访问码..."
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            如果研究室设置了访问码，请输入后加入
                        </p>
                    </div>

                    {/* 加入按钮 */}
                    <Button
                        className="w-full gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white h-11"
                        onClick={handleJoin}
                        disabled={isPending || isFull}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <LogIn className="h-4 w-4" />
                        )}
                        {isFull ? "研究室已满" : "加入研究室"}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
