"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import NovelEditor from "@/components/editor/NovelEditor";
import { ArrowLeft, Save, X, Plus, HelpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updatePost } from "../../actions";
import { type JSONContent } from "novel";
import { createClient } from "@/lib/supabase/client";

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

export default function EditPostPage() {
    const router = useRouter();
    const params = useParams();
    const postId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [contentJson, setContentJson] = useState<JSONContent | undefined>(undefined);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isHelpWanted, setIsHelpWanted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadPost();
    }, [postId]);

    const loadPost = async () => {
        const supabase = createClient();

        // 验证用户身份
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("请先登录");
            router.push("/login");
            return;
        }

        // 获取帖子
        const { data: post, error } = await supabase
            .from("posts")
            .select("*")
            .eq("id", postId)
            .single();

        if (error || !post) {
            toast.error("帖子不存在");
            router.push("/dashboard");
            return;
        }

        // 验证是否为作者
        if (post.author_id !== user.id) {
            toast.error("无权编辑此帖子");
            router.push(`/posts/${postId}`);
            return;
        }

        setTitle(post.title);
        setContentJson(post.content as JSONContent);
        setSelectedTags(post.tags || []);
        setIsHelpWanted(post.is_help_wanted || false);
        setContent("valid");
        setLoading(false);
    };

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
            const result = await updatePost(postId, {
                title: title.trim(),
                content: contentJson,
                tags: selectedTags,
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("更新成功！");
            router.push(`/posts/${postId}`);
        } catch (error) {
            toast.error("更新失败，请重试");
            console.error("Submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

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
                            <Link href={`/posts/${postId}`}>
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    返回
                                </Button>
                            </Link>
                            <h1 className="text-lg font-semibold text-foreground">编辑帖子</h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant={isHelpWanted ? "default" : "outline"}
                                size="sm"
                                onClick={() => setIsHelpWanted(!isHelpWanted)}
                                className={`gap-2 ${isHelpWanted ? "bg-amber-500 hover:bg-amber-600 text-white border-transparent" : "text-muted-foreground"}`}
                            >
                                <HelpCircle className="h-4 w-4" />
                                {isHelpWanted ? "高亮求助" : "设为求助"}
                            </Button>

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        保存中...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        保存
                                    </>
                                )}
                            </Button>
                        </div>
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
                    <motion.div variants={itemVariants} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                                内容 <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono">/</kbd>
                                <span>唤起命令菜单</span>
                            </div>
                        </div>
                        <div className="relative group">
                            {/* 渐变边框效果 */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 via-primary/25 to-primary/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                            <div className="relative min-h-[500px] bg-background rounded-lg border border-border/50 shadow-lg overflow-hidden">
                                {/* 顶部装饰条 */}
                                <div className="h-10 bg-muted/30 border-b border-border/50 flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-2">富文本编辑器</span>
                                </div>
                                <NovelEditor
                                    initialValue={contentJson}
                                    onChange={(json) => {
                                        setContentJson(json);
                                        const hasContent = json?.content?.some((node: any) =>
                                            node.content?.length > 0 || (node.type === 'image') || (node.type === 'codeBlock')
                                        );
                                        setContent(hasContent ? "valid" : "");
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* 提示信息 */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
                    >
                        <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                            编辑提示
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            修改帖子后，旧版本将自动保存。读者可以通过"查看历史"功能查看修订记录。
                        </p>
                    </motion.div>
                </div>
            </main>
        </motion.div>
    );
}
