"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { useState } from "react";
import { CommentItem, type CommentData } from "./CommentItem";

interface CollapsibleRepliesProps {
    replies: CommentData[];
    postId: string;
    postAuthorId?: string;
    currentUserId?: string;
    isPostAuthor?: boolean;
    onReply?: (parentId: string) => void;
    onDelete?: (commentId: string) => void;
    onAccept?: (commentId: string) => void;
    commentLikeStatus?: Record<string, boolean>;
    collapseThreshold?: number;
    replyingTo?: string | null;
    onSubmitComment?: (content: object, parentId?: string | null) => Promise<void>;
    currentUser?: {
        id: string;
        username: string;
        avatar_url?: string;
    } | null;
    onCancelReply?: () => void;
}

export function CollapsibleReplies({
    replies,
    postId,
    postAuthorId,
    currentUserId,
    isPostAuthor,
    onReply,
    onDelete,
    onAccept,
    commentLikeStatus = {},
    collapseThreshold = 3,
}: CollapsibleRepliesProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldCollapse = replies.length > collapseThreshold;
    const visibleReplies = shouldCollapse && !isExpanded
        ? replies.slice(0, collapseThreshold)
        : replies;
    const hiddenCount = replies.length - collapseThreshold;

    if (replies.length === 0) return null;

    return (
        <div className="ml-8 border-l-2 border-border/30 pl-4 space-y-0">
            <AnimatePresence initial={false}>
                {visibleReplies.map((reply) => (
                    <motion.div
                        key={reply.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <CommentItem
                            comment={reply}
                            postId={postId}
                            postAuthorId={postAuthorId}
                            currentUserId={currentUserId}
                            depth={1}
                            maxDepth={2}
                            onReply={onReply}
                            onDelete={onDelete}
                            isPostAuthor={isPostAuthor}
                            onAccept={onAccept}
                            isLiked={commentLikeStatus[reply.id]}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* 折叠/展开按钮 */}
            {shouldCollapse && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 py-2 px-3 text-sm text-primary 
                               hover:text-primary/80 hover:bg-primary/5 rounded-md transition-colors mt-1"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="h-4 w-4" />
                            收起回复
                        </>
                    ) : (
                        <>
                            <MessageCircle className="h-4 w-4" />
                            展开 {hiddenCount} 条回复
                            <ChevronDown className="h-4 w-4" />
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
