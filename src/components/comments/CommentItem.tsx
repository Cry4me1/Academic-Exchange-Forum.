"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RichTextRenderer } from "@/components/posts/RichTextRenderer";
import { MessageCircle, Heart, CornerDownRight } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

export interface CommentAuthor {
    id: string;
    username: string;
    avatar_url?: string;
    title?: string;
}

export interface CommentData {
    id: string;
    content: object;
    author: CommentAuthor;
    created_at: string;
    like_count: number;
    replies?: CommentData[];
}

interface CommentItemProps {
    comment: CommentData;
    depth?: number;
    maxDepth?: number;
    onReply?: (parentId: string) => void;
}

export function CommentItem({
    comment,
    depth = 0,
    maxDepth = 2,
    onReply
}: CommentItemProps) {
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(comment.like_count);

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
        // TODO: 调用 API 更新点赞状态
    };

    const handleReply = () => {
        onReply?.(comment.id);
    };

    const authorInitials = comment.author.username?.slice(0, 2).toUpperCase() || "?";
    const isNested = depth > 0;

    return (
        <div className={`${isNested ? "ml-8 border-l-2 border-border/50 pl-4" : ""}`}>
            <div className="py-4">
                {/* 评论头部 */}
                <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage src={comment.author.avatar_url} alt={comment.author.username} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-xs font-semibold">
                            {authorInitials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        {/* 用户名和时间 */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-foreground">
                                {comment.author.username}
                            </span>
                            {comment.author.title && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                    {comment.author.title}
                                </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(comment.created_at)}
                            </span>
                        </div>

                        {/* 评论内容 */}
                        <div className="mt-2">
                            <RichTextRenderer
                                content={comment.content}
                                className="text-sm prose-sm"
                            />
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-4 mt-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-2 gap-1.5 text-xs ${isLiked ? "text-red-500" : "text-muted-foreground"}`}
                                onClick={handleLike}
                            >
                                <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
                                {likeCount > 0 && <span>{likeCount}</span>}
                            </Button>

                            {depth < maxDepth - 1 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 gap-1.5 text-xs text-muted-foreground"
                                    onClick={handleReply}
                                >
                                    <CornerDownRight className="h-3.5 w-3.5" />
                                    回复
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 递归渲染回复（限制层级） */}
            {comment.replies && comment.replies.length > 0 && depth < maxDepth - 1 && (
                <div className="space-y-0">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            depth={depth + 1}
                            maxDepth={maxDepth}
                            onReply={onReply}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default CommentItem;
