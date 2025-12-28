"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RichTextRenderer } from "@/components/posts";
import {
    ArrowLeft,
    Heart,
    MessageCircle,
    Bookmark,
    Share2,
    MoreHorizontal,
    Calendar,
    Eye,
} from "lucide-react";

// 模拟帖子数据（后续会从数据库获取）
const mockPost = {
    id: "1",
    title: "深度学习在自然语言处理中的最新进展：从 Transformer 到大语言模型",
    content: {
        type: "doc",
        content: [
            {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "引言" }],
            },
            {
                type: "paragraph",
                content: [
                    {
                        type: "text",
                        text: "本文综述了近年来深度学习技术在自然语言处理领域的重大突破。从 2017 年 Transformer 架构的提出，到 GPT、BERT 等预训练模型的广泛应用，再到如今 ChatGPT 等大语言模型的惊人表现，我们见证了 NLP 领域的快速发展。",
                    },
                ],
            },
            {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "核心公式" }],
            },
            {
                type: "paragraph",
                content: [
                    { type: "text", text: "Transformer 模型的核心是自注意力机制。注意力分数的计算公式为：" },
                ],
            },
            {
                type: "paragraph",
                content: [
                    {
                        type: "mathematics",
                        attrs: {
                            latex: "\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V",
                            isBlock: true,
                        },
                    },
                ],
            },
            {
                type: "paragraph",
                content: [
                    { type: "text", text: "其中 " },
                    { type: "mathematics", attrs: { latex: "Q", isBlock: false } },
                    { type: "text", text: "、" },
                    { type: "mathematics", attrs: { latex: "K", isBlock: false } },
                    { type: "text", text: "、" },
                    { type: "mathematics", attrs: { latex: "V", isBlock: false } },
                    { type: "text", text: " 分别代表查询、键和值矩阵，" },
                    { type: "mathematics", attrs: { latex: "d_k", isBlock: false } },
                    { type: "text", text: " 是键向量的维度。" },
                ],
            },
            {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "代码示例" }],
            },
            {
                type: "paragraph",
                content: [{ type: "text", text: "以下是使用 PyTorch 实现的简化注意力机制：" }],
            },
            {
                type: "codeBlock",
                attrs: { language: "python" },
                content: [
                    {
                        type: "text",
                        text: `import torch
import torch.nn.functional as F

def attention(query, key, value, mask=None):
    d_k = query.size(-1)
    scores = torch.matmul(query, key.transpose(-2, -1)) / math.sqrt(d_k)
    
    if mask is not None:
        scores = scores.masked_fill(mask == 0, -1e9)
    
    attention_weights = F.softmax(scores, dim=-1)
    return torch.matmul(attention_weights, value)`,
                    },
                ],
            },
            {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "结论" }],
            },
            {
                type: "paragraph",
                content: [
                    {
                        type: "text",
                        text: "Transformer 架构的出现彻底改变了 NLP 领域的研究范式。通过预训练和微调的方式，大语言模型在各种下游任务上都取得了优异的表现。",
                    },
                ],
            },
        ],
    },
    author: {
        id: "1",
        name: "张教授",
        avatar: "",
        initials: "张",
        title: "计算机科学与技术系教授",
    },
    tags: ["Computer Science", "Mathematics", "AI"],
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    likes: 128,
    comments: 24,
    views: 1024,
    isLiked: false,
    isBookmarked: false,
};

// 标签颜色映射
const tagColors: Record<string, string> = {
    "Computer Science": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    Mathematics: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    AI: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    Physics: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    default: "bg-muted text-muted-foreground border-muted",
};

// 动画变体
const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as const,
        },
    },
};

const contentVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] as const,
            delay: 0.2,
        },
    },
};

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export default function PostDetailPage() {
    const params = useParams();
    const postId = params.id as string;

    // 实际项目中，这里会从数据库获取帖子数据
    const post = mockPost;

    return (
        <motion.div
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
        >
            {/* 顶部导航 */}
            <motion.header
                variants={itemVariants}
                className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
            >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                返回
                            </Button>
                        </Link>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                                <Share2 className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* 主内容 */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 文章头部 */}
                <motion.article variants={itemVariants} className="mb-8">
                    {/* 标签 */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag) => (
                            <Badge
                                key={tag}
                                variant="outline"
                                className={`${tagColors[tag] || tagColors.default} font-medium`}
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>

                    {/* 标题 */}
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 leading-tight">
                        {post.title}
                    </h1>

                    {/* 作者信息 */}
                    <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-border/50">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-semibold">
                                    {post.author.initials}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-foreground">{post.author.name}</p>
                                <p className="text-sm text-muted-foreground">{post.author.title}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(post.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{post.views} 浏览</span>
                            </div>
                        </div>
                    </div>
                </motion.article>

                {/* 文章内容 */}
                <motion.div variants={contentVariants} className="mb-12">
                    <RichTextRenderer
                        content={post.content}
                        className="leading-relaxed"
                    />
                </motion.div>

                {/* 互动区域 */}
                <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between py-6 border-t border-b border-border/50"
                >
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-2 ${post.isLiked ? "text-red-500" : ""}`}
                        >
                            <Heart className={`h-5 w-5 ${post.isLiked ? "fill-current" : ""}`} />
                            <span>{post.likes}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <MessageCircle className="h-5 w-5" />
                            <span>{post.comments}</span>
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-2 ${post.isBookmarked ? "text-primary" : ""}`}
                    >
                        <Bookmark className={`h-5 w-5 ${post.isBookmarked ? "fill-current" : ""}`} />
                        收藏
                    </Button>
                </motion.div>

                {/* 评论区（占位） */}
                <motion.section variants={itemVariants} className="mt-12">
                    <h2 className="text-xl font-semibold text-foreground mb-6">
                        评论 ({post.comments})
                    </h2>
                    <div className="bg-muted/30 rounded-xl p-8 text-center">
                        <p className="text-muted-foreground">评论功能即将上线...</p>
                    </div>
                </motion.section>
            </main>
        </motion.div>
    );
}
