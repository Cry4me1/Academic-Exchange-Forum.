"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Clock, FileText, Lock, Unlock } from "lucide-react";
import { MathText } from "@/components/ui/math-text";

export const COLLECTION_COVER_PRESETS = [
    { id: 'preset-academic', name: '学术蓝', class: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700', icon: '📚' },
    { id: 'preset-science', name: '科学绿', class: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700', icon: '🔬' },
    { id: 'preset-math', name: '数学紫', class: 'bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600', icon: '∑' },
    { id: 'preset-tech', name: '科技黑', class: 'bg-gradient-to-br from-slate-800 via-zinc-800 to-neutral-900', icon: '⚡' },
    { id: 'preset-nature', name: '自然橙', class: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500', icon: '🌿' },
    { id: 'preset-cosmos', name: '宇宙蓝', class: 'bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-900', icon: '🌌' },
    { id: 'preset-philosophy', name: '哲学灰', class: 'bg-gradient-to-br from-stone-500 via-gray-600 to-slate-700', icon: '🤔' },
    { id: 'preset-art', name: '艺术粉', class: 'bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-600', icon: '🎨' },
];

interface CollectionCardProps {
    id: string;
    name: string;
    description?: string | null;
    coverUrl?: string | null;
    coverStyle?: string;
    postCount: number;
    isPublic: boolean;
    updatedAt?: string;
    authorName?: string;
    showAuthor?: boolean;
}

export function CollectionCard({
    id,
    name,
    description,
    coverUrl,
    coverStyle = "preset-academic",
    postCount,
    isPublic,
    updatedAt,
    authorName,
    showAuthor = false,
}: CollectionCardProps) {
    const preset = COLLECTION_COVER_PRESETS.find(p => p.id === coverStyle) || COLLECTION_COVER_PRESETS[0];

    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="group block w-full"
        >
            <Link href={`/collections/${id}`}>
                <div className="relative bg-card/80 backdrop-blur-sm border border-border/40 rounded-xl overflow-hidden shadow-sm hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                    
                    {/* Cover Area - 3:2 Aspect Ratio */}
                    <div className="relative w-full aspect-[3/2] overflow-hidden">
                        {coverUrl ? (
                            <Image
                                src={coverUrl}
                                alt={name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                            />
                        ) : (
                            <div className={cn("absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-700 ease-in-out opacity-90 group-hover:opacity-100", preset.class)}>
                                <span className="text-6xl opacity-50">{preset.icon}</span>
                            </div>
                        )}
                        
                        {/* Status Badges */}
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                            {!isPublic && (
                                <div className="bg-background/80 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                                    <Lock className="w-3 h-3" />
                                    <span>私密</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                            <h3 className="text-xl font-bold text-white leading-tight line-clamp-2 drop-shadow-md">
                                {name}
                            </h3>
                        </div>
                    </div>

                    {/* Meta Area */}
                    <div className="p-4">
                        {description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                                {description}
                            </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-auto pt-2">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>{postCount} 篇</span>
                                </div>
                                {updatedAt && (
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{new Date(updatedAt).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                            
                            {showAuthor && authorName && (
                                <div className="text-xs font-medium text-primary/80 truncate max-w-[100px]">
                                    {authorName}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
