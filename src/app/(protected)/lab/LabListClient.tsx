"use client";

import { LabRoomCard } from "@/components/lab/LabRoomCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FlaskConical, Plus } from "lucide-react";
import Link from "next/link";

interface LabListClientProps {
    rooms: {
        id: string;
        name: string;
        description?: string;
        room_type: string;
        is_encrypted: boolean;
        max_members: number;
        is_archived: boolean;
        updated_at: string;
        lab_members: { count: number }[];
        lab_post_links: { count: number }[];
    }[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },

};

export default function LabListClient({ rooms }: LabListClientProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 页头 */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                            <FlaskConical className="h-6 w-6 text-violet-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">我的研究室</h1>
                            <p className="text-sm text-muted-foreground">帖子共读 · 实时协作 · 知识共创</p>
                        </div>
                    </div>
                    <Link href="/lab/create">
                        <Button className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/20">
                            <Plus className="h-4 w-4" />
                            创建研究室
                        </Button>
                    </Link>
                </motion.div>

                {/* 研究室列表 */}
                {rooms.length > 0 ? (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {rooms.map((room) => (
                            <motion.div key={room.id} variants={itemVariants}>
                                <LabRoomCard room={room} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-24"
                    >
                        <div className="p-6 rounded-full bg-muted/50 mb-6">
                            <FlaskConical className="h-12 w-12 text-muted-foreground/40" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            还没有研究室
                        </h2>
                        <p className="text-muted-foreground text-center max-w-md mb-6">
                            创建一个研究室，邀请同学一起共读帖子、协作笔记、讨论公式推导
                        </p>
                        <Link href="/lab/create">
                            <Button className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white">
                                <Plus className="h-4 w-4" />
                                创建第一个研究室
                            </Button>
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
