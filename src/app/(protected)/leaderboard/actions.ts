"use server";

import { createClient } from "@/lib/supabase/server";

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    avatarUrl: string;
    score: number;
    isLocked?: boolean;
}

/**
 * 获取周点赞排行榜
 * 统计近7天内帖子被点赞次数最多的作者
 */
export async function getWeeklyLikeLeaderboard(): Promise<LeaderboardEntry[]> {
    const supabase = await createClient();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase.rpc("get_weekly_like_leaderboard", {
        since_date: sevenDaysAgo.toISOString(),
    });

    if (error) {
        console.error("Failed to fetch weekly like leaderboard:", error);
        // Fallback: 直接查询 posts 表的 like_count
        return await getFallbackLikeLeaderboard();
    }

    return (data || []).map(
        (
            item: {
                author_id: string;
                username: string;
                avatar_url: string;
                total_likes: number;
            },
            index: number
        ) => ({
            rank: index + 1,
            userId: item.author_id,
            username: item.username || "匿名学者",
            avatarUrl: item.avatar_url || "",
            score: Number(item.total_likes) || 0,
        })
    );
}

/**
 * Fallback: 直接从 posts 表获取点赞排行
 */
async function getFallbackLikeLeaderboard(): Promise<LeaderboardEntry[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("posts")
        .select(
            "author_id, like_count, author:profiles!author_id(id, username, avatar_url)"
        )
        .eq("is_published", true)
        .order("like_count", { ascending: false })
        .limit(50);

    if (error || !data) return [];

    // 按作者聚合总点赞
    const authorMap = new Map<
        string,
        { username: string; avatarUrl: string; totalLikes: number }
    >();

    for (const post of data) {
        const authorId = post.author_id;
        const author = post.author as unknown as {
            id: string;
            username: string;
            avatar_url: string;
        };
        const existing = authorMap.get(authorId);
        if (existing) {
            existing.totalLikes += post.like_count || 0;
        } else {
            authorMap.set(authorId, {
                username: author?.username || "匿名学者",
                avatarUrl: author?.avatar_url || "",
                totalLikes: post.like_count || 0,
            });
        }
    }

    return Array.from(authorMap.entries())
        .sort((a, b) => b[1].totalLikes - a[1].totalLikes)
        .slice(0, 10)
        .map(([userId, info], index) => ({
            rank: index + 1,
            userId,
            username: info.username,
            avatarUrl: info.avatarUrl,
            score: info.totalLikes,
        }));
}

/**
 * 获取周收藏排行榜
 * 统计近7天内帖子被收藏次数最多的作者
 */
export async function getWeeklyBookmarkLeaderboard(): Promise<
    LeaderboardEntry[]
> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("posts")
        .select(
            "author_id, bookmark_count, author:profiles!author_id(id, username, avatar_url)"
        )
        .eq("is_published", true)
        .order("bookmark_count", { ascending: false })
        .limit(50);

    if (error || !data) return [];

    // 按作者聚合总收藏
    const authorMap = new Map<
        string,
        { username: string; avatarUrl: string; totalBookmarks: number }
    >();

    for (const post of data) {
        const authorId = post.author_id;
        const author = post.author as unknown as {
            id: string;
            username: string;
            avatar_url: string;
        };
        const existing = authorMap.get(authorId);
        if (existing) {
            existing.totalBookmarks += post.bookmark_count || 0;
        } else {
            authorMap.set(authorId, {
                username: author?.username || "匿名学者",
                avatarUrl: author?.avatar_url || "",
                totalBookmarks: post.bookmark_count || 0,
            });
        }
    }

    return Array.from(authorMap.entries())
        .sort((a, b) => b[1].totalBookmarks - a[1].totalBookmarks)
        .slice(0, 10)
        .map(([userId, info], index) => ({
            rank: index + 1,
            userId,
            username: info.username,
            avatarUrl: info.avatarUrl,
            score: info.totalBookmarks,
        }));
}

/**
 * 获取社区贡献值排行榜
 * 按总发帖数排名，Hansszh 永久锁定榜首
 */
export async function getContributionLeaderboard(): Promise<
    LeaderboardEntry[]
> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("posts")
        .select(
            "author_id, author:profiles!author_id(id, username, avatar_url)"
        )
        .eq("is_published", true);

    if (error || !data) return [];

    // 按作者聚合总发帖数
    const authorMap = new Map<
        string,
        { username: string; avatarUrl: string; postCount: number }
    >();

    for (const post of data) {
        const authorId = post.author_id;
        const author = post.author as unknown as {
            id: string;
            username: string;
            avatar_url: string;
        };
        const existing = authorMap.get(authorId);
        if (existing) {
            existing.postCount += 1;
        } else {
            authorMap.set(authorId, {
                username: author?.username || "匿名学者",
                avatarUrl: author?.avatar_url || "",
                postCount: 1,
            });
        }
    }

    const sorted = Array.from(authorMap.entries())
        .sort((a, b) => b[1].postCount - a[1].postCount)
        .slice(0, 20);

    // 查找 Hansszh
    const hansszhIndex = sorted.findIndex(
        ([, info]) => info.username.toLowerCase() === "hansszh"
    );

    let result: LeaderboardEntry[];

    if (hansszhIndex >= 0) {
        // Hansszh 已在列表中，将其移到榜首
        const [hansszhEntry] = sorted.splice(hansszhIndex, 1);
        result = [
            {
                rank: 1,
                userId: hansszhEntry[0],
                username: hansszhEntry[1].username,
                avatarUrl: hansszhEntry[1].avatarUrl,
                score: hansszhEntry[1].postCount,
                isLocked: true,
            },
            ...sorted.slice(0, 9).map(([userId, info], index) => ({
                rank: index + 2,
                userId,
                username: info.username,
                avatarUrl: info.avatarUrl,
                score: info.postCount,
            })),
        ];
    } else {
        // Hansszh 未在列表中，从 profiles 表中查找
        const { data: hansszhProfile } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .ilike("username", "hansszh")
            .single();

        const hansszhEntry: LeaderboardEntry = {
            rank: 1,
            userId: hansszhProfile?.id || "hansszh-locked",
            username: hansszhProfile?.username || "Hansszh",
            avatarUrl: hansszhProfile?.avatar_url || "",
            score: hansszhProfile
                ? authorMap.get(hansszhProfile.id)?.postCount || 0
                : 999,
            isLocked: true,
        };

        result = [
            hansszhEntry,
            ...sorted.slice(0, 9).map(([userId, info], index) => ({
                rank: index + 2,
                userId,
                username: info.username,
                avatarUrl: info.avatarUrl,
                score: info.postCount,
            })),
        ];
    }

    return result;
}
