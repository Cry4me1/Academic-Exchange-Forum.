import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard 加载骨架屏
 * 利用 React Suspense Streaming SSR，用户在数据到达前先看到布局轮廓
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* 顶部导航栏骨架 */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-9 w-64 rounded-lg hidden md:block" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-20 rounded-full hidden md:block" />
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区骨架 */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* 左侧栏骨架 */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="space-y-6">
              <div className="bg-card/50 rounded-xl border border-border/50 p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
              <div className="bg-card/50 rounded-xl border border-border/50 p-4 space-y-3">
                <Skeleton className="h-4 w-20" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* 中间内容骨架 */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Banner 骨架 */}
            <Skeleton className="h-40 w-full rounded-xl" />

            {/* Tabs 骨架 */}
            <div className="flex gap-2">
              {["最新", "热门", "关注"].map((tab) => (
                <Skeleton key={tab} className="h-9 w-16 rounded-lg" />
              ))}
            </div>

            {/* 帖子卡片骨架 */}
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card/50 rounded-xl border border-border/50 p-5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-4 pt-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>

          {/* 右侧栏骨架 */}
          <aside className="hidden xl:block w-[340px] shrink-0 space-y-6">
            <Skeleton className="h-12 w-full rounded-xl" />
            <div className="bg-card/50 rounded-xl border border-border/50 p-4 space-y-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
            <div className="bg-card/50 rounded-xl border border-border/50 p-4 space-y-3">
              <Skeleton className="h-4 w-20" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-7 w-16 rounded-full" />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
