"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Users, Eye } from "lucide-react";
import { motion } from "framer-motion";

export interface Spectator {
    username: string;
    avatar_url?: string;
}

interface SpectatorBadgeProps {
    spectators: Spectator[];
}

export function SpectatorBadge({ spectators }: SpectatorBadgeProps) {
    const [isOpen, setIsOpen] = useState(false);
    
    // 只显示前 3 个人的头像
    const displaySpectators = spectators.slice(0, 3);
    const hasMore = spectators.length > 3;

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur-md border border-border/50 shadow-sm hover:bg-background/80 transition-all text-xs font-medium text-muted-foreground hover:text-foreground"
            >
                <div className="relative flex items-center justify-center">
                    <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <Eye className="h-3.5 w-3.5 mr-1" />
                </div>
                
                <span className="tabular-nums font-semibold text-foreground">
                    {spectators.length}
                </span>{" "}
                人正在围观
                
                {spectators.length > 0 && (
                    <div className="flex -space-x-2 ml-1 overflow-hidden">
                        {displaySpectators.map((spec, i) => (
                            <Avatar key={i} className="h-5 w-5 border border-background ring-1 ring-border/30">
                                <AvatarImage src={spec.avatar_url} />
                                <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                                    {spec.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        ))}
                        {hasMore && (
                            <div className="flex items-center justify-center h-5 w-5 rounded-full border border-background bg-muted text-[8px] font-bold text-muted-foreground ring-1 ring-border/30">
                                +{spectators.length - 3}
                            </div>
                        )}
                    </div>
                )}
            </motion.button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            在线围观榜
                        </DialogTitle>
                        <DialogDescription>
                            当前有 {spectators.length} 位学术同仁正在实时观战
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 max-h-[300px] overflow-y-auto space-y-3">
                        {spectators.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-6">暂无围观者在场</p>
                        ) : (
                            spectators.map((spec, index) => (
                                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={spec.avatar_url} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                            {spec.username.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{spec.username}</p>
                                        <p className="text-xs text-muted-foreground">正在观战现场</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
