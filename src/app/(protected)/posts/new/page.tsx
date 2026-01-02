"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/editor";
import { ArrowLeft, Send, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { createPost } from "../actions";

const AVAILABLE_TAGS = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Biology",
    "Economics",
    "Philosophy",
    "AI",
    "Chemistry",
    "Engineering",
];

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

export default function NewPostPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [contentJson, setContentJson] = useState<object | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTagToggle = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter((t) => t !== tag));
        } else if (selectedTags.length < 3) {
            setSelectedTags([...selectedTags, tag]);
        } else {
            toast.error("最多只能选择 3 个标签");
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("请输入标题");
            return;
        }

        if (!content.trim() || content === "<p></p>") {
            toast.error("请输入内容");
            return;
        }

        if (selectedTags.length === 0) {
            toast.error("请至少选择一个标签");
            return;
        }

        if (!contentJson) {
            toast.error("内容格式错误");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createPost({
                title: title.trim(),
                content: contentJson,
                tags: selectedTags,
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("发布成功！");
            router.push(`/posts/${result.data?.id}`);
        } catch (error) {
            toast.error("发布失败，请重试");
            console.error("Submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    返回
                                </Button>
                            </Link>
                            <h1 className="text-lg font-semibold text-foreground">发布新帖子</h1>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    发布中...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    发布
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </motion.header>

            {/* 主内容 */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    {/* 标题输入 */}
                    <motion.div variants={itemVariants} className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">
                            标题 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            placeholder="输入一个吸引人的标题..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-lg h-12"
                            maxLength={100}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {title.length}/100
                        </p>
                    </motion.div>

                    {/* 标签选择 */}
                    <motion.div variants={itemVariants} className="space-y-3">
                        <Label className="text-sm font-medium">
                            标签 <span className="text-destructive">*</span>
                            <span className="text-muted-foreground font-normal ml-2">
                                (选择 1-3 个)
                            </span>
                        </Label>

                        {/* 已选标签 */}
                        {selectedTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {selectedTags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="default"
                                        className="gap-1 pr-1 cursor-pointer"
                                        onClick={() => handleTagToggle(tag)}
                                    >
                                        {tag}
                                        <X className="h-3 w-3" />
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* 可选标签 */}
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TAGS.filter((tag) => !selectedTags.includes(tag)).map(
                                (tag) => (
                                    <Badge
                                        key={tag}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-primary/10 transition-colors"
                                        onClick={() => handleTagToggle(tag)}
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        {tag}
                                    </Badge>
                                )
                            )}
                        </div>
                    </motion.div>

                    {/* 内容编辑器 */}
                    <motion.div variants={itemVariants} className="space-y-2">
                        <Label className="text-sm font-medium">
                            内容 <span className="text-destructive">*</span>
                        </Label>
                        <RichTextEditor
                            onChange={setContent}
                            onJsonChange={setContentJson}
                            placeholder={"开始撰写你的学术内容...\n\n提示：\n• 使用 $...$ 插入行内数学公式，如 $E=mc^2$\n• 使用 $$...$$ 插入块级公式\n• 拖拽图片直接上传\n• 点击工具栏按钮添加代码块"}
                            className="min-h-[400px]"
                        />
                    </motion.div>

                    {/* 提示信息 */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-muted/50 rounded-lg p-4 border border-border/50"
                    >
                        <h3 className="text-sm font-medium text-foreground mb-2">发布提示</h3>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• 请确保内容符合学术规范，尊重他人知识产权</li>
                            <li>• 数学公式使用 LaTeX 语法，如 $\int_0^\infty e^{"{-x^2}"}dx$</li>
                            <li>• 代码块支持多种编程语言的语法高亮</li>
                            <li>• 图片大小限制为 10MB，支持 JPEG、PNG、GIF、WebP 格式</li>
                        </ul>
                    </motion.div>
                </div>
            </main>
        </motion.div>
    );
}
