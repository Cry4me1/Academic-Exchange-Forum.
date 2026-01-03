"use client";

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import NovelViewer from "@/components/editor/NovelViewer";
import { MessageCircle, Heart, CornerDownRight, Trash2, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import { toggleLikeComment, deleteComment } from "@/app/(protected)/posts/[id]/actions";
import { toggleAcceptAnswer } from "@/app/(protected)/posts/actions";
import { toast } from "sonner";

export interface CommentAuthor {
    id: string;
    username: string;
    avatar_url?: string;
    title?: string;
}

export interface CommentData {
    id: string;
    post_id?: string;
    content: object;
    author: CommentAuthor;
    created_at: string;
    like_count: number;
    replies?: CommentData[];
    is_accepted?: boolean;
}

interface CommentItemProps {
    comment: CommentData;
    postId: string;
    currentUserId?: string;
    depth?: number;
    maxDepth?: number;
    onReply?: (parentId: string) => void;
    onDelete?: (commentId: string) => void;
    isLiked?: boolean;
    isPostAuthor?: boolean;
    onAccept?: (commentId: string) => void;
}

export function CommentItem({
    comment,
    postId,
    currentUserId,
    depth = 0,
    maxDepth = 2,
    onReply,
    onDelete,
    isLiked: initialIsLiked = false,
    isPostAuthor = false,
    onAccept,
}: CommentItemProps) {
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeCount, setLikeCount] = useState(comment.like_count);
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAccepted, setIsAccepted] = useState(comment.is_accepted);

    const handleAccept = async () => {
        if (!isPostAuthor) return;

        // 乐观更新
        const newAccepted = !isAccepted;
        setIsAccepted(newAccepted);
        // 通知父组件以便更新其他评论的状态 (例如互斥)
        onAccept?.(comment.id);

        const result = await toggleAcceptAnswer(comment.id);
        if (result.error) {
            setIsAccepted(!newAccepted);
            toast.error(result.error);
        } else {
            toast.success(newAccepted ? "已采纳回答" : "已取消采纳");
        }
    };

    const handleLike = () => {
        // 乐观更新
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);

        startTransition(async () => {
            const result = await toggleLikeComment(comment.id);
            if (result.error) {
                // 回滚
                setIsLiked(!newLiked);
                setLikeCount(newLiked ? likeCount : likeCount + 1);
                toast.error(result.error);
            }
        });
    };

    const handleReply = () => {
        onReply?.(comment.id);
    };

    const handleDelete = async () => {
        if (!confirm("确定要删除这条评论吗？")) return;

        setIsDeleting(true);
        const result = await deleteComment(comment.id, postId);
        setIsDeleting(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("评论已删除");
            onDelete?.(comment.id);
        }
    };

    const authorInitials = comment.author.username?.slice(0, 2).toUpperCase() || "?";
    const isNested = depth > 0;
    const isAuthor = currentUserId === comment.author.id;

    return (
        <div className={`${isNested ? "ml-8 border-l-2 border-border/50 pl-4" : ""} ${isAccepted ? "bg-green-500/5 rounded-xl border border-green-500/20 p-2 -mx-2" : ""}`}>
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
                            {isAccepted && (
                                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                    <CheckCircle2 className="h-3 w-3" />
                                    已采纳
                                </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(comment.created_at)}
                            </span>
                        </div>

                        {/* 评论内容 */}
                        <div className="mt-2">
                            <NovelViewer
                                initialValue={comment.content}
                            />
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-4 mt-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-2 gap-1.5 text-xs ${isLiked ? "text-red-500" : "text-muted-foreground"}`}
                                onClick={handleLike}
                                disabled={isPending}
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

                            {isAuthor && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {isDeleting ? "删除中..." : "删除"}
                                </Button>
                            )}

                            {isPostAuthor && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-7 px-2 gap-1.5 text-xs ${isAccepted ? "text-green-600 hover:text-green-700 hover:bg-green-500/10" : "text-muted-foreground hover:text-green-600"}`}
                                    onClick={handleAccept}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {isAccepted ? "取消采纳" : "采纳"}
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
                            postId={postId}
                            currentUserId={currentUserId}
                            depth={depth + 1}
                            maxDepth={maxDepth}
                            onReply={onReply}
                            onDelete={onDelete}
                            isPostAuthor={isPostAuthor}
                            onAccept={onAccept}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default CommentItem;
