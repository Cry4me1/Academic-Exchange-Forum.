"use client";

import { PostCard, type PostCardProps } from "./PostCard";
import type { FeedFilter } from "./FeedTabs";

// 模拟数据
const mockPosts: Omit<PostCardProps, "id">[] = [
    {
        author: { id: "1", name: "张教授", initials: "张" },
        title: "深度学习在自然语言处理中的最新进展：从 Transformer 到大语言模型",
        content: "本文综述了近年来深度学习技术在自然语言处理领域的重大突破。从 2017 年 Transformer 架构的提出，到 GPT、BERT 等预训练模型的广泛应用，再到如今 ChatGPT 等大语言模型的惊人表现，我们见证了 NLP 领域的快速发展...",
        tags: ["Computer Science", "Mathematics"],
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 分钟前
        likes: 128,
        comments: 24,
        isLiked: true,
    },
    {
        author: { id: "2", name: "李博士", initials: "李" },
        title: "量子计算基础：从量子比特到量子纠缠",
        content: "量子计算是利用量子力学原理进行信息处理的新型计算范式。本文将介绍量子计算的基本概念，包括量子比特（qubit）、叠加态、量子纠缠等核心概念，以及常见的量子门操作...",
        tags: ["Physics", "Computer Science"],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 小时前
        likes: 89,
        comments: 15,
    },
    {
        author: { id: "3", name: "王研究员", initials: "王" },
        title: "博弈论在经济学中的应用：纳什均衡的现代解读",
        content: "博弈论作为研究策略互动的数学理论，在经济学中有着广泛的应用。本文将从纳什均衡的基本定义出发，探讨其在市场竞争、拍卖设计、机制设计等领域的具体应用...",
        tags: ["Economics", "Mathematics"],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 小时前
        likes: 67,
        comments: 8,
        isBookmarked: true,
    },
    {
        author: { id: "4", name: "陈同学", initials: "陈" },
        title: "CRISPR 基因编辑技术的伦理思考",
        content: "CRISPR-Cas9 技术的发展为基因编辑带来了革命性的变化。然而，这项技术也引发了广泛的伦理讨论。本文将从技术可行性、伦理边界、法律监管等角度，探讨基因编辑技术的未来发展方向...",
        tags: ["Biology", "Philosophy"],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 天前
        likes: 156,
        comments: 42,
    },
    {
        author: { id: "5", name: "刘教授", initials: "刘" },
        title: "黎曼猜想与素数分布：一个跨越百年的数学问题",
        content: "黎曼猜想是数学史上最著名的未解决问题之一，它与素数的分布规律密切相关。本文将介绍黎曼 zeta 函数的基本性质，以及黎曼猜想的数学含义和重要性...",
        tags: ["Mathematics"],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 天前
        likes: 234,
        comments: 31,
    },
];

interface PostFeedProps {
    filter: FeedFilter;
}

export function PostFeed({ filter }: PostFeedProps) {
    // 根据筛选条件排序帖子（模拟）
    const sortedPosts = [...mockPosts].sort((a, b) => {
        switch (filter) {
            case "trending":
                return b.likes - a.likes;
            case "following":
                return (b.isLiked ? 1 : 0) - (a.isLiked ? 1 : 0);
            case "latest":
            default:
                return b.createdAt.getTime() - a.createdAt.getTime();
        }
    });

    if (sortedPosts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <svg
                        className="h-12 w-12 text-muted-foreground/50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">暂无内容</h3>
                <p className="text-sm text-muted-foreground">
                    {filter === "following" ? "关注更多学者来查看他们的动态" : "还没有帖子，快来发布第一条吧！"}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sortedPosts.map((post, index) => (
                <PostCard
                    key={index}
                    id={String(index + 1)}
                    {...post}
                />
            ))}
        </div>
    );
}
