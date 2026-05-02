"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "@/lib/utils";
import { adminDeleteComment } from "@/lib/admin/actions";
import { toast } from "sonner";
import { ArrowLeft, Trash2, MessageSquare } from "lucide-react";
import Link from "next/link";
import NovelViewer from "@/components/editor/NovelViewer";

interface AdminComment {
  id: string;
  content: object;
  created_at: string;
  parent_id: string | null;
  like_count: number | null;
  author: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface AdminCommentsClientProps {
  postId: string;
  comments: AdminComment[];
}

export function AdminCommentsClient({ postId, comments }: AdminCommentsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (commentId: string) => {
    if (!confirm("确定要删除这条评论吗？此操作无法撤销。")) return;

    startTransition(async () => {
      try {
        await adminDeleteComment(commentId, postId);
        toast.success("评论已删除");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "操作失败");
      }
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/posts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> 评论管理
          </h2>
          <p className="text-sm text-muted-foreground">共 {comments.length} 条评论</p>
        </div>
      </div>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-border/50 rounded-xl bg-card">
            暂无评论
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="overflow-hidden">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                <div className="shrink-0 flex items-center sm:items-start gap-3">
                  <Avatar className="h-10 w-10 border shadow-sm">
                    <AvatarImage src={comment.author?.avatar_url || ""} />
                    <AvatarFallback>
                      {comment.author?.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="sm:hidden flex-1">
                    <p className="font-semibold text-sm">
                      {comment.author?.full_name || comment.author?.username || "未知用户"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at))}
                    </p>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="hidden sm:flex items-center gap-2 mb-2">
                    <p className="font-semibold text-sm">
                      {comment.author?.full_name || comment.author?.username || "未知用户"}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at))}
                    </span>
                    {comment.parent_id && (
                      <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                        回复
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-foreground max-w-none dark:prose-invert bg-muted/20 p-3 rounded-lg border border-border/50">
                    <NovelViewer initialValue={comment.content as any} />
                  </div>
                </div>

                <div className="shrink-0 flex sm:flex-col justify-end gap-2 mt-4 sm:mt-0">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2 w-full sm:w-auto"
                    onClick={() => handleDelete(comment.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
