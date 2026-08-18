"use client";

import { extractTextFromContent } from "@/lib/extract-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/ui/math-text";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Clock, Heart, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface CollectionPostListProps {
    posts: Array<{
        id: string;
        title: string;
        content: string | object;
        tags: string[];
        like_count: number;
        comment_count: number;
        created_at: string;
        position: number;
    }>;
    collectionId: string;
    isAuthor: boolean;
    onRemove?: (postId: string) => void;
    onReorder?: (postIds: string[]) => void;
}

export function CollectionPostList({ posts: initialPosts, collectionId, isAuthor, onRemove, onReorder }: CollectionPostListProps) {
    const [posts, setPosts] = useState(initialPosts);

    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newPosts = [...posts];
        const temp = newPosts[index];
        newPosts[index] = newPosts[index - 1];
        newPosts[index - 1] = temp;
        setPosts(newPosts);
        onReorder?.(newPosts.map(p => p.id));
    };

    const handleMoveDown = (index: number) => {
        if (index === posts.length - 1) return;
        const newPosts = [...posts];
        const temp = newPosts[index];
        newPosts[index] = newPosts[index + 1];
        newPosts[index + 1] = temp;
        setPosts(newPosts);
        onReorder?.(newPosts.map(p => p.id));
    };

    const handleRemove = (postId: string) => {
        setPosts(posts.filter(p => p.id !== postId));
        onRemove?.(postId);
    };

    if (posts.length === 0) {
        return (
            <div className="py-12 text-center border-2 border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">这个专栏还没有添加任何内容</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <AnimatePresence mode="popLayout">
                {posts.map((post, index) => {
                    const plainSummary = extractTextFromContent(post.content);
                    
                    return (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            key={post.id}
                            className="group relative flex gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:shadow-md transition-all duration-300"
                        >
                            {/* Chapter Number */}
                            <div className="flex-shrink-0 flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-serif text-lg border border-primary/20">
                                    {index + 1}
                                </div>
                                {isAuthor && (
                                    <div className="flex flex-col gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                                            onClick={() => handleMoveUp(index)}
                                            disabled={index === 0}
                                        >
                                            <ArrowUp className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                                            onClick={() => handleMoveDown(index)}
                                            disabled={index === posts.length - 1}
                                        >
                                            <ArrowDown className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-4">
                                    <Link href={`/posts/${post.id}`} className="block w-full">
                                        <h4 className="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 leading-tight mb-2">
                                            <MathText text={post.title} inlineOnly />
                                        </h4>
                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                                            <MathText text={plainSummary.slice(0, 240)} inlineOnly />
                                        </p>
                                    </Link>
                                    {isAuthor && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                            onClick={() => handleRemove(post.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Meta */}
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {post.tags?.slice(0, 3).map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0 h-5 font-medium bg-secondary/50">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                        <div className="flex items-center gap-1">
                                            <Heart className="h-3.5 w-3.5" />
                                            <span>{post.like_count || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageCircle className="h-3.5 w-3.5" />
                                            <span>{post.comment_count || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2 border-l border-border pl-2">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
