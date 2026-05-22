import { Skeleton } from "@/components/ui/skeleton";

/**
 * 帖子详情页加载骨架屏
 */
export default function PostDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按钮 + 标题 */}
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* 标签 */}
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* 标题 */}
        <Skeleton className="h-8 w-3/4 mb-4" />

        {/* 作者信息 */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/50">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>

        {/* 正文内容 */}
        <div className="space-y-3 mb-8">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* 互动栏 */}
        <div className="flex gap-4 py-4 border-t border-b border-border/50 mb-8">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>

        {/* 评论区 */}
        <Skeleton className="h-6 w-24 mb-4" />
        <Skeleton className="h-24 w-full rounded-lg mb-6" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 mb-4">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
